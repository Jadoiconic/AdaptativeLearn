'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Module {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  difficulty: string;
  type: string;
  videoUrl?: string;
  fileUrl?: string;
  assessmentId?: string;
  isPublished: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  thumbnail?: string;
  moduleCount?: number;
  objectives?: string[];
  requirements?: string[];
  instructorId?: {
    name: string;
    email: string;
  };
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleProgress, setModuleProgress] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<number, number>>({});
  const [assessmentSubmitted, setAssessmentSubmitted] = useState(false);
  const [assessmentScore, setAssessmentScore] = useState<number | null>(null);

  useEffect(() => {
    fetchCourse();
    fetchModules();
    fetchProgress();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?courseId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch course');
      }
      
      const data = await response.json();
      
      if (data.success && data.courses.length > 0) {
        setCourse(data.courses[0]);
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await fetch(`/api/modules?courseId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch modules');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setModules(data.modules);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress?courseId=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch progress');
      }
      
      const data = await response.json();
      
      if (data.success) {
        const progressMap: Record<string, string> = {};
        data.progress.forEach((p: any) => {
          progressMap[p.moduleId._id] = p.status;
        });
        setModuleProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const handleModuleClick = async (module: Module) => {
    setSelectedModule(module);
    
    // Update progress to in-progress when module is clicked
    if (session?.user?.id) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleId: module._id,
            status: 'in-progress',
            timeSpent: 0,
          }),
        });
        
        // Refresh progress
        fetchProgress();
      } catch (error) {
        console.error('Error updating progress:', error);
      }
    }
  };

  const handleMarkComplete = async (moduleId: string) => {
    if (session?.user?.id) {
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            moduleId,
            status: 'completed',
            timeSpent: 0,
            score: 100,
          }),
        });
        
        // Refresh modules to update progress indicators
        fetchModules();
      } catch (error) {
        console.error('Error marking module as complete:', error);
      }
    }
  };

  const handleTakeAssessment = async (module: Module) => {
    try {
      const response = await fetch(`/api/assessments?moduleId=${module._id}`);
      const data = await response.json();
      
      if (data.success && data.assessments.length > 0) {
        setSelectedModule(module);
        setCurrentAssessment(data.assessments[0]);
        setAssessmentAnswers({});
        setAssessmentSubmitted(false);
        setAssessmentScore(null);
        setShowAssessmentModal(true);
      } else {
        alert('No assessment found for this module');
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
      alert('Failed to load assessment');
    }
  };

  const handleSubmitAssessment = async () => {
    if (!currentAssessment || !selectedModule) return;

    try {
      // Calculate score
      let correctAnswers = 0;
      let totalPoints = 0;
      
      currentAssessment.questions.forEach((question: any, index: number) => {
        totalPoints += question.points;
        if (assessmentAnswers[index] === question.correctAnswer) {
          correctAnswers += question.points;
        }
      });
      
      const score = totalPoints > 0 ? Math.round((correctAnswers / totalPoints) * 100) : 0;
      setAssessmentScore(score);
      setAssessmentSubmitted(true);

      // Update progress with assessment score
      await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: selectedModule._id,
          status: score >= currentAssessment.passingScore ? 'completed' : 'in-progress',
          timeSpent: 0,
          score,
        }),
      });

      // If failed, create AI recommendation for the module
      if (score < currentAssessment.passingScore) {
        try {
          await fetch('/api/recommendations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session?.user?.id,
              suggestedModules: [selectedModule._id],
              reasoning: `You scored ${score}% on "${selectedModule.title}". Review the module content and try the assessment again to improve your understanding.`,
              priority: 'high',
            }),
          });
        } catch (error) {
          console.error('Error creating AI recommendation:', error);
          // Don't fail the submission if recommendation creation fails
        }
      }

      // Refresh progress
      fetchProgress();
      fetchModules();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      alert('Failed to submit assessment');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-24" />
        </div>

        {/* Course Header Skeleton */}
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>

        {/* Modules Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-gray-700 mb-4">Course not found</div>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4"
        >
          ← Back to Courses
        </Button>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
        <p className="text-slate-600">{course.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Info */}
        <div className="lg:col-span-1">
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Category</span>
                  <span className="text-sm font-medium text-slate-900">{course.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Difficulty</span>
                  <span className="text-sm font-medium text-slate-900 capitalize">{course.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Duration</span>
                  <span className="text-sm font-medium text-slate-900">{course.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Modules</span>
                  <span className="text-sm font-medium text-slate-900">{course.moduleCount || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Instructor</span>
                  <span className="text-sm font-medium text-slate-900">{course.instructorId?.name || 'Unknown'}</span>
                </div>
              </div>

              {course.objectives && course.objectives.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Objectives</h3>
                  <ul className="space-y-1">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {course.requirements && course.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Requirements</h3>
                  <ul className="space-y-1">
                    {course.requirements.map((requirement, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modules List */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200/60">
            <CardHeader>
              <CardTitle className="text-slate-900">Course Modules</CardTitle>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No modules available yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modules
                    .sort((a, b) => a.order - b.order)
                    .map((module) => (
                    <div
                      key={module._id}
                      className={`border border-slate-200 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                        selectedModule?._id === module._id
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:shadow-md hover:border-blue-200'
                      }`}
                      onClick={() => handleModuleClick(module)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                          {module.order}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                              module.type === 'video' ? 'bg-red-100 text-red-700' :
                              module.type === 'quiz' ? 'bg-yellow-100 text-yellow-700' :
                              module.type === 'exercise' ? 'bg-green-100 text-green-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {module.type}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              module.isPublished 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {module.isPublished ? 'Published' : 'Draft'}
                            </span>
                            {moduleProgress[module._id] && (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                moduleProgress[module._id] === 'completed' 
                                  ? 'bg-green-100 text-green-700' 
                                  : moduleProgress[module._id] === 'in-progress'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {moduleProgress[module._id] === 'completed' ? '✓ Completed' : 'In Progress'}
                              </span>
                            )}
                            {module.assessmentId && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTakeAssessment(module);
                                }}
                                className="ml-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                Take Assessment
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{module.description}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="capitalize">{module.difficulty}</span>
                            {module.videoUrl && <span>• Video</span>}
                            {module.fileUrl && <span>• File</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Module Content Display */}
          {selectedModule && (
            <Card className="border-slate-200/60 mt-6">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-slate-900">{selectedModule.title}</CardTitle>
                {moduleProgress[selectedModule._id] !== 'completed' && (
                  <Button
                    onClick={() => handleMarkComplete(selectedModule._id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Mark as Complete
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <p className="text-slate-700">{selectedModule.content}</p>
                </div>
                
                {selectedModule.videoUrl && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Video</h3>
                    <a
                      href={selectedModule.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Watch Video →
                    </a>
                  </div>
                )}
                
                {selectedModule.fileUrl && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Resources</h3>
                    <a
                      href={selectedModule.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Download File →
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Assessment Modal */}
      {showAssessmentModal && currentAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">{currentAssessment.title}</h2>
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            {currentAssessment.description && (
              <p className="text-slate-600 mb-4">{currentAssessment.description}</p>
            )}

            {assessmentSubmitted ? (
              <div className="text-center py-8">
                <div className="text-4xl font-bold mb-4">
                  {assessmentScore ?? 0}%
                </div>
                <p className={`text-lg mb-4 ${
                  (assessmentScore ?? 0) >= currentAssessment.passingScore
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {(assessmentScore ?? 0) >= currentAssessment.passingScore
                    ? 'Passed!'
                    : 'Not Passed - Try Again'}
                </p>
                <p className="text-slate-600 mb-4">
                  Passing score: {currentAssessment.passingScore}%
                </p>
                <div className="flex gap-3 justify-center">
                  {(assessmentScore ?? 0) >= currentAssessment.passingScore && selectedModule && (
                    <Button
                      onClick={() => {
                        // Find next module
                        const currentModuleIndex = modules.findIndex(m => m._id === selectedModule._id);
                        const nextModule = modules[currentModuleIndex + 1];
                        if (nextModule) {
                          setSelectedModule(nextModule);
                          setShowAssessmentModal(false);
                        } else {
                          // No more modules, close modal
                          setShowAssessmentModal(false);
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Continue to Next Module
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowAssessmentModal(false)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-6">
                  {currentAssessment.questions.map((question: any, index: number) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-2">
                        {question.options.map((option: string, optIndex: number) => (
                          <label key={optIndex} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={optIndex}
                              checked={assessmentAnswers[index] === optIndex}
                              onChange={(e) => setAssessmentAnswers({
                                ...assessmentAnswers,
                                [index]: parseInt(e.target.value)
                              })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-slate-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowAssessmentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitAssessment}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={Object.keys(assessmentAnswers).length < currentAssessment.questions.length}
                  >
                    Submit Assessment
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
