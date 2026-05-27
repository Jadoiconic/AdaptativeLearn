'use client';

import { useState, useEffect } from 'react';
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
  isPublished: boolean;
}

interface Course {
  _id: string;
  title: string;
  description: string;
}

export default function ModulesPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedModuleForAssessment, setSelectedModuleForAssessment] = useState<Module | null>(null);
  const [assessmentQuestions, setAssessmentQuestions] = useState<Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>>([{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [passingScore, setPassingScore] = useState(60);
  const [timeLimit, setTimeLimit] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    order: 1,
    difficulty: 'beginner',
    type: 'lesson',
    videoUrl: '',
    fileUrl: '',
    isPublished: false,
  });

  useEffect(() => {
    fetchCourses();
  }, [session]);

  useEffect(() => {
    if (selectedCourse) {
      fetchModules(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses?instructorId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.courses);
        if (data.courses.length > 0) {
          setSelectedCourse(data.courses[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      const response = await fetch(`/api/modules?courseId=${courseId}`);
      
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

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId: selectedCourse,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create module');
      }

      const result = await response.json();
      console.log('Module created successfully:', result);
      
      setShowCreateModal(false);
      fetchModules(selectedCourse);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        content: '',
        order: modules.length + 1,
        difficulty: 'beginner',
        type: 'lesson',
        videoUrl: '',
        fileUrl: '',
        isPublished: false,
      });
    } catch (error) {
      console.error('Error creating module:', error);
      alert('Failed to create module');
    }
  };

  const handleCreateAssessment = async () => {
    if (!selectedModuleForAssessment || !assessmentTitle || assessmentQuestions.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: selectedModuleForAssessment._id,
          courseId: selectedCourse,
          title: assessmentTitle,
          description: assessmentDescription,
          questions: assessmentQuestions,
          passingScore,
          timeLimit: timeLimit ? parseInt(timeLimit) : undefined,
          isPublished: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create assessment');
      }

      const result = await response.json();
      console.log('Assessment created successfully:', result);
      
      setShowAssessmentModal(false);
      fetchModules(selectedCourse);
      
      // Reset assessment form
      setAssessmentTitle('');
      setAssessmentDescription('');
      setPassingScore(60);
      setTimeLimit('');
      setAssessmentQuestions([{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 }]);
      setSelectedModuleForAssessment(null);
      
      alert('Assessment created successfully!');
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment');
    }
  };

  const handleAddQuestion = () => {
    setAssessmentQuestions([
      ...assessmentQuestions,
      { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 1 },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (assessmentQuestions.length > 1) {
      setAssessmentQuestions(assessmentQuestions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, field: string, value: string | number | string[]) => {
    const updatedQuestions = [...assessmentQuestions];
    if (field === 'options') {
      updatedQuestions[index].options = value as string[];
    } else if (field === 'correctAnswer' || field === 'points') {
      updatedQuestions[index][field as 'correctAnswer' | 'points'] = value as number;
    } else {
      updatedQuestions[index][field as 'question'] = value as string;
    }
    setAssessmentQuestions(updatedQuestions);
  };

  const handleOpenAssessmentModal = (module: Module) => {
    setSelectedModuleForAssessment(module);
    setAssessmentTitle(`${module.title} Assessment`);
    setShowAssessmentModal(true);
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure you want to delete this module?')) {
      return;
    }

    try {
      const response = await fetch(`/api/modules?moduleId=${moduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete module');
      }

      alert('Module deleted successfully');
      fetchModules(selectedCourse);
    } catch (error) {
      console.error('Error deleting module:', error);
      alert('Failed to delete module');
    }
  };

  const handleEditModule = (module: Module) => {
    setSelectedModuleForAssessment(module);
    setFormData({
      title: module.title,
      description: module.description,
      content: module.content,
      order: module.order,
      difficulty: module.difficulty,
      type: module.type,
      videoUrl: module.videoUrl || '',
      fileUrl: module.fileUrl || '',
      isPublished: module.isPublished,
    });
    setShowCreateModal(true);
  };

  const handleUpdateModule = async () => {
    if (!selectedModuleForAssessment) return;

    try {
      const response = await fetch('/api/modules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          moduleId: selectedModuleForAssessment._id,
          courseId: selectedCourse,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update module');
      }

      alert('Module updated successfully');
      setShowCreateModal(false);
      fetchModules(selectedCourse);
      setSelectedModuleForAssessment(null);
    } catch (error) {
      console.error('Error updating module:', error);
      alert('Failed to update module');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Course Selection Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Module List Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b last:border-b-0">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-3/4 mb-1" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Module Management</h1>
        <p className="text-slate-600">Create and manage modules for your courses</p>
      </div>

      {/* Course Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="w-full px-4 py-2 border text-slate-900 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {courses.map((course) => (
            <option key={course._id} value={course._id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      {/* Modules List */}
      <Card className="border-slate-200/60 mb-6">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-slate-900">Modules</CardTitle>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            + Add Module
          </Button>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600">No modules yet. Create your first module!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => (
                <div key={module._id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-slate-500">Module {module.order}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          module.isPublished 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {module.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                          {module.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">{module.title}</h3>
                      <p className="text-sm text-slate-600">{module.description}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditModule(module)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenAssessmentModal(module)}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        Add Assessment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteModule(module._id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {selectedModuleForAssessment ? 'Edit Module' : 'Create New Module'}
              </h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedModuleForAssessment(null);
                }}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={selectedModuleForAssessment ? handleUpdateModule : handleCreateModule}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Module title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    rows={3}
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Module description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    required
                    rows={5}
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Module content"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Order *</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                      required
                      min="1"
                      className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                      className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lesson">Lesson</option>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="exercise">Exercise</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Video URL</label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({...formData, videoUrl: e.target.value})}
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">File URL</label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({...formData, fileUrl: e.target.value})}
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/file"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="ml-2 text-sm text-slate-700">
                    Publish immediately
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Create Module
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Create Assessment</h2>
              <button
                onClick={() => setShowAssessmentModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assessment Title *</label>
                <input
                  type="text"
                  value={assessmentTitle}
                  onChange={(e) => setAssessmentTitle(e.target.value)}
                  required
                  className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Assessment title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={assessmentDescription}
                  onChange={(e) => setAssessmentDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Assessment description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Passing Score (%)</label>
                  <input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time Limit (minutes, optional)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">Questions</label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddQuestion}
                  >
                    + Add Question
                  </Button>
                </div>
                
                {assessmentQuestions.map((question, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-medium text-slate-900">Question {index + 1}</h4>
                      {assessmentQuestions.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveQuestion(index)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Question *</label>
                        <input
                          type="text"
                          value={question.question}
                          onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                          required
                          className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter your question"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Options *</label>
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 mb-2">
                            <input
                              type="radio"
                              name={`correct-${index}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => handleQuestionChange(index, 'correctAnswer', optIndex)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...question.options];
                                newOptions[optIndex] = e.target.value;
                                handleQuestionChange(index, 'options', newOptions);
                              }}
                              required
                              className="flex-1 px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${optIndex + 1}`}
                            />
                          </div>
                        ))}
                        <p className="text-xs text-slate-500 mt-1">Select the radio button for the correct answer</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Points</label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) => handleQuestionChange(index, 'points', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-4 py-2 border text-slate-700 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAssessmentModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateAssessment} className="bg-blue-600 hover:bg-blue-700">
                  Create Assessment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
