'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Course {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  thumbnail?: string;
  moduleCount?: number;
  isPublished: boolean;
  createdAt: string;
  enrolledCount?: number;
  rating?: number;
  progress?: number;
}

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
  totalRevenue: number;
  completionRate: number;
}

interface Activity {
  id: string;
  activityText: string;
  detailsText: string;
  timeAgo: string;
  color: string;
  createdAt: string;
}

export default function InstructorDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<InstructorStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorData();
  }, []);

  const fetchInstructorData = async () => {
    try {
      setLoading(true);
      
      // Fetch courses from database
      const response = await fetch(`/api/courses?instructorId=${session?.user?.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCourses(data.courses);
      } else {
        console.error('Error fetching courses:', data.error);
      }
      
      // Calculate stats from courses
      const totalCourses = data.courses?.length || 0;
      const totalStudents = data.courses?.reduce((sum: number, course: Course) => sum + (course.enrolledCount || 0), 0) || 0;
      const publishedCourses = data.courses?.filter((c: Course) => c.isPublished) || [];
      const averageRating = publishedCourses.length > 0 
        ? publishedCourses.reduce((sum: number, c: Course) => sum + (c.rating || 0), 0) / publishedCourses.length 
        : 0;
      
      setStats({
        totalCourses,
        totalStudents,
        averageRating: Number(averageRating.toFixed(1)),
        totalRevenue: 0,
        completionRate: 0
      });
      
      // Fetch recent activities
      const activityResponse = await fetch('/api/instructor/activity');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivities(activityData.activities || []);
      }

      // Fetch real student stats
      const studentsRes = await fetch('/api/instructor/students');
      if (studentsRes.ok) {
        const sd = await studentsRes.json();
        setStats((prev) =>
          prev
            ? {
                ...prev,
                totalStudents: sd.summary?.totalStudents ?? prev.totalStudents,
                completionRate: sd.summary?.avgProgressPercentage ?? prev.completionRate,
              }
            : prev
        );
      }
    } catch (error) {
      console.error('Error fetching instructor data:', error);
    } finally {
      setLoading(false);
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

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Courses Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-32 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
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
              Manage your courses and track student progress
            </p>
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3">
              <button className="px-4 py-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium rounded-lg transition-all duration-200 border border-white/30">
                Create New Course
              </button>
              <button className="px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-lg transition-all duration-200 border border-white/20"
                onClick={() => router.push('/dashboard/instructor/analytics')}
                >
                  View Analytics
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalCourses || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 0-1.601.567-1.86 1.409a7.011 7.011 0 01-2.516-2.976 7.21 7.21 0 01-2.516-2.976c.3-.922 0-1.601.567-1.86 1.409l-2.8 2.034a1 1 0 00-1.175 0l-2.8-2.034a1 1 0 00-1.176 0L5.521 9.509a1 1 0 00.366.516L8.653 18.48a1 1 0 001.176 0l2.8-2.034c.3-.921 0-1.601.567-1.86 1.409z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.averageRating || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0 0c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${stats?.totalRevenue || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completionRate || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Courses Section */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="border-gray-200">
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-gray-900">My Courses</CardTitle>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                + Create Course
              </button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
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
                            <span>{course.duration}</span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {course.moduleCount || 0} modules
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              course.isPublished 
                                ? 'bg-green-100 text-green-700 border border-green-200' 
                                : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                            }`}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                            {course.rating && (
                              <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-4 h-4 text-yellow-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 0-1.601.567-1.86 1.409a7.011 7.011 0 01-2.516-2.976 7.21 7.21 0 01-2.516-2.976c.3-.922 0-1.601.567-1.86 1.409l-2.8 2.034a1 1 0 00-1.175 0l-2.8-2.034a1 1 0 00-1.176 0L5.521 9.509a1 1 0 00.366.516L8.653 18.48a1 1 0 001.176 0l2.8-2.034c.3-.921 0-1.601.567-1.86 1.409z" />
                                </svg>
                                {course.rating}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {course.enrolledCount !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{course.enrolledCount} students enrolled</span>
                            {course.progress && <span>{course.progress}% completion rate</span>}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button className="px-3 py-1 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-all duration-200">
                              Edit
                            </button>
                            <button className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200">
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create New Course
                  </div>
                </button>
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-6M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Manage Modules
                  </div>
                </button>
                <button
                  onClick={() => router.push('/dashboard/instructor/students')}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    View Student Progress
                  </div>
                </button>
                <button className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-200 border border-gray-200">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v8m3 0h6" />
                    </svg>
                    Generate Reports
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.activityText}</p>
                        <p className="text-xs text-gray-600">{activity.detailsText}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-600 py-4">No recent activity</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
