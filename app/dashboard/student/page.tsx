'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EnrolledCourse {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail?: string;
  moduleCount?: number;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastAccessed: string;
}

interface Progress {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  status: string;
  score?: number;
  completedAt?: string;
}

interface Recommendation {
  _id: string;
  reasoning: string;
  priority: string;
  suggestedModules: Array<{
    _id: string;
    title: string;
    difficulty: string;
    type: string;
  }>;
}

export default function StudentDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentProgress, setRecentProgress] = useState<Progress[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'recommendations'>('courses');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch published courses from database
      const response = await fetch('/api/courses?published=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          data.courses.map(async (course: any) => {
            try {
              const progressResponse = await fetch(`/api/progress?courseId=${course._id}`);
              const progressData = await progressResponse.json();
              
              if (progressData.success && progressData.progress.length > 0) {
                const completedModules = progressData.progress.filter(
                  (p: any) => p.status === 'completed'
                ).length;
                
                // Fetch modules to get total count
                const modulesResponse = await fetch(`/api/modules?courseId=${course._id}`);
                const modulesData = await modulesResponse.json();
                const totalModules = modulesData.success ? modulesData.modules.length : 0;
                
                const progressPercentage = totalModules > 0 
                  ? Math.round((completedModules / totalModules) * 100) 
                  : 0;
                
                return {
                  _id: course._id,
                  title: course.title,
                  description: course.description,
                  category: course.category,
                  difficulty: course.difficulty,
                  thumbnail: course.thumbnail,
                  moduleCount: course.moduleCount,
                  progress: progressPercentage,
                  completedModules,
                  totalModules,
                  lastAccessed: new Date(course.createdAt).toISOString().split('T')[0],
                };
              }
              
              // Fetch modules to get total count even without progress
              const modulesResponse = await fetch(`/api/modules?courseId=${course._id}`);
              const modulesData = await modulesResponse.json();
              const totalModules = modulesData.success ? modulesData.modules.length : 0;
              
              return {
                _id: course._id,
                title: course.title,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                thumbnail: course.thumbnail,
                moduleCount: course.moduleCount,
                progress: 0,
                completedModules: 0,
                totalModules,
                lastAccessed: new Date(course.createdAt).toISOString().split('T')[0],
              };
            } catch (error) {
              console.error('Error fetching progress for course:', course._id, error);
              return {
                _id: course._id,
                title: course.title,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                thumbnail: course.thumbnail,
                moduleCount: course.moduleCount,
                progress: 0,
                completedModules: 0,
                totalModules: 0,
                lastAccessed: new Date(course.createdAt).toISOString().split('T')[0],
              };
            }
          })
        );
        
        setEnrolledCourses(coursesWithProgress);
      } else {
        console.error('Error fetching courses:', data.error);
      }
      
      // Fetch recent progress
      const progressResponse = await fetch('/api/progress');
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        if (progressData.success) {
          const transformedProgress: Progress[] = progressData.progress.map((p: any) => ({
            courseId: p.courseId._id,
            courseTitle: p.courseId.title,
            moduleId: p.moduleId._id,
            moduleTitle: p.moduleId.title,
            status: p.status,
            score: p.score,
            completedAt: p.completedAt,
          }));
          setRecentProgress(transformedProgress.slice(0, 5)); // Show last 5
        }
      }
      
      // Fetch recommendations
      const recommendationsResponse = await fetch('/api/recommendations?type=all');
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        if (recommendationsData.success) {
          setRecommendations(recommendationsData.recommendations);
        }
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading student dashboard...</div>
          <div className="text-sm text-gray-500 mt-1">Preparing your learning experience</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-blue-600 rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-xl">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Welcome back, {session?.user?.name}!
            </h1>
            <p className="text-blue-100 text-base sm:text-lg">
              Continue your learning journey and track your progress
            </p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-200 border border-white/30">
                Browse Courses
              </button>
              <button className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-white/20">
                View Progress
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'courses'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              My Courses
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'recommendations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Recommendations
              {recommendations.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  {recommendations.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Completed Modules</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.reduce((acc, course) => acc + course.completedModules, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Learning Streak</p>
              <p className="text-2xl font-bold text-gray-900">7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Courses Section */}
        {activeTab === 'courses' && (
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-gray-200">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-gray-900">My Courses</CardTitle>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                  Browse More
                </button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                  <div key={course._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="w-32 h-24 flex-shrink-0 relative">
                        {course.thumbnail ? (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg ${course.thumbnail ? 'hidden' : ''}`}>
                          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Course Info */}
                      <div className="flex-1 space-y-3 cursor-pointer" onClick={() => router.push(`/dashboard/courses/${course._id}`)}>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{course.description}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{course.category}</span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{course.difficulty}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            Last: {new Date(course.lastAccessed).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm font-semibold text-gray-900">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {course.completedModules}/{course.totalModules} modules completed
                      </p>
                    </div>
                    <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                      <div className="text-sm text-gray-500">
                        {course.progress === 100 ? '✅ Completed' : '📚 In Progress'}
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                        {course.progress === 100 ? 'Review' : 'Continue Learning'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Recommendations Section */}
        {activeTab === 'recommendations' && (
          <div className="xl:col-span-2 space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No recommendations at this time. Keep learning!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec: any, index: number) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                        {rec.type === 'failed-assessment' && (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                Failed Assessment
                              </span>
                              <span className="text-sm text-gray-600">
                                Score: {rec.score}%
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.module.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{rec.course.title}</p>
                            <p className="text-sm text-gray-700 mb-3">{rec.reasoning}</p>
                            <button
                              onClick={() => router.push(`/dashboard/courses/${rec.course._id}`)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200"
                            >
                              Retry Module
                            </button>
                          </>
                        )}
                        {rec.type === 'ai-recommendation' && (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                rec.priority === 'high' 
                                  ? 'bg-red-100 text-red-700' 
                                  : rec.priority === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {rec.priority} priority
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{rec.reasoning}</p>
                            <div className="space-y-2">
                              {rec.modules && rec.modules.map((module: any, idx: number) => (
                                <div key={idx} className="text-sm text-gray-900 font-medium">
                                  • {module.title}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <Card className="border-gray-200">
            <CardHeader className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <CardTitle className="text-gray-900">AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        rec.priority === 'high' 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : rec.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{rec.reasoning}</p>
                    <div className="space-y-2">
                      {rec.suggestedModules.map((module: any, index: number) => (
                        <div key={module._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900">{module.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-600">{module.difficulty}</span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">{module.type}</span>
                            </div>
                          </div>
                          <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200">
                            Start
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200">
            <CardHeader className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProgress.map((progress, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      progress.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {progress.status === 'completed' ? 'Completed' : 'In Progress'}: {progress.moduleTitle}
                      </p>
                      <p className="text-xs text-gray-600">{progress.courseTitle}</p>
                      {progress.score && (
                        <p className="text-xs text-gray-500 mt-1">Score: {progress.score}%</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          progress.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {progress.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {progress.completedAt ? new Date(progress.completedAt).toLocaleDateString() : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
