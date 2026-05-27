'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  thumbnail?: string;
  moduleCount?: number;
  instructorId?: {
    name: string;
    email: string;
  };
  isPublished: boolean;
  createdAt: string;
  progress?: number;
}

export default function CoursesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [session]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      // Fetch courses based on user role
      let url = '/api/courses?published=true';
      
      if (session?.user?.role === 'instructor') {
        url = `/api/courses?instructorId=${session.user.id}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Fetch progress for each course if user is a student
        const coursesWithProgress = await Promise.all(
          data.courses.map(async (course: any) => {
            if (session?.user?.role === 'student') {
              try {
                const progressResponse = await fetch(`/api/progress?courseId=${course._id}`);
                const progressData = await progressResponse.json();
                
                if (progressData.success && progressData.progress.length > 0) {
                  // Fetch modules to get total count
                  const modulesResponse = await fetch(`/api/modules?courseId=${course._id}`);
                  const modulesData = await modulesResponse.json();
                  const totalModules = modulesData.success ? modulesData.modules.length : 0;
                  
                  const completedModules = progressData.progress.filter(
                    (p: any) => p.status === 'completed'
                  ).length;
                  
                  const progressPercentage = totalModules > 0 
                    ? Math.round((completedModules / totalModules) * 100) 
                    : 0;
                  
                  return {
                    ...course,
                    progress: progressPercentage,
                  };
                }
              } catch (error) {
                console.error('Error fetching progress for course:', course._id, error);
              }
            }
            
            // For instructors or if no progress, return 0 progress
            return {
              ...course,
              progress: 0,
            };
          })
        );
        
        setCourses(coursesWithProgress);
      } else {
        console.error('Error fetching courses:', data.error);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading courses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
        <p className="text-slate-600">Continue your learning journey and track your progress</p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200/60">
            {/* Course Thumbnail */}
            <div className="h-48 relative">
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`absolute inset-0 flex items-center justify-center ${course.thumbnail ? 'hidden' : ''}`}>
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700 capitalize">
                  {course.difficulty}
                </span>
              </div>
            </div>

            <CardContent className="p-6 cursor-pointer" onClick={() => router.push(`/dashboard/courses/${course._id}`)}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>By {course.instructorId?.name || 'Unknown'}</span>
                  <div className="flex items-center gap-2">
                    <span>{course.duration}</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                      {course.moduleCount || 0} modules
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <span className="text-sm font-medium text-slate-700">{course.progress || 0}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                {(course.progress || 0) > 0 ? 'Continue Learning' : 'Start Course'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for when no courses */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
          <p className="text-slate-600 mb-6">Start your learning journey by enrolling in your first course</p>
          <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
            Browse Courses
          </button>
        </div>
      )}
    </div>
  );
}
