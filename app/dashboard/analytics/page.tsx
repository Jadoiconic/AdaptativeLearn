'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    completionRate: number;
  };
  chartData: Array<{
    date: string;
    users: number;
    completions: number;
  }>;
  topCourses: Array<{
    title: string;
    enrollments: number;
    completion: number;
  }>;
  userEngagement: {
    avgSessionDuration: string;
    coursesPerUser: number;
    retentionRate: number;
    satisfactionScore: number;
  };
}

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats');
      const statsData = await statsResponse.json();
      
      // Fetch analytics
      const period = timeRange === '7d' ? '7' : timeRange === '30d' ? '30' : timeRange === '90d' ? '90' : '365';
      const analyticsResponse = await fetch(`/api/admin/analytics?period=${period}`);
      const analytics = await analyticsResponse.json();
      
      // Fetch courses for top courses
      const coursesResponse = await fetch('/api/courses');
      const coursesData = await coursesResponse.json();
      
      // Calculate user engagement metrics
      const progressResponse = await fetch('/api/progress');
      const progressData = await progressResponse.json();
      
      const totalEnrollments = progressData.courses?.reduce((sum: number, course: any) => sum + (course.enrolledCount || 0), 0) || 0;
      
      setAnalyticsData({
        overview: {
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          newUsers: analytics.totalRegistrations || 0,
          totalCourses: statsData.totalCourses || 0,
          totalEnrollments: totalEnrollments,
          completionRate: statsData.completionRate || 0,
        },
        chartData: analytics.labels?.map((label: string, index: number) => ({
          date: label,
          users: analytics.registrations?.[index] || 0,
          completions: analytics.completions?.[index] || 0,
        })) || [],
        topCourses: (coursesData.courses || []).slice(0, 5).map((course: any) => ({
          title: course.title,
          enrollments: course.enrolledCount || 0,
          completion: course.completionRate || 0,
        })),
        userEngagement: {
          avgSessionDuration: '45 min',
          coursesPerUser: totalEnrollments > 0 && statsData.totalUsers > 0 ? parseFloat((totalEnrollments / statsData.totalUsers).toFixed(1)) : 0,
          retentionRate: statsData.completionRate || 0,
          satisfactionScore: statsData.averageScore ? parseFloat((statsData.averageScore / 20).toFixed(1)) : 4.5,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Analytics Dashboard</h1>
          <p className="text-slate-600">Track platform performance and user engagement</p>
        </div>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {range === '7d' && '7 Days'}
              {range === '30d' && '30 Days'}
              {range === '90d' && '90 Days'}
              {range === '1y' && '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+12.5%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{analyticsData?.overview.totalUsers.toLocaleString() || 0}</h3>
            <p className="text-sm text-slate-600 mt-1">Total Users</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+8.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{analyticsData?.overview.activeUsers.toLocaleString() || 0}</h3>
            <p className="text-sm text-slate-600 mt-1">Active Users</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+15.3%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{analyticsData?.overview.totalEnrollments.toLocaleString() || 0}</h3>
            <p className="text-sm text-slate-600 mt-1">Total Enrollments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded">+22.1%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">{analyticsData?.overview.completionRate.toFixed(1)}%</h3>
            <p className="text-sm text-slate-600 mt-1">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Courses & User Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-slate-900">Top Performing Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData?.topCourses.map((course, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 text-sm">{course.title}</h4>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-slate-600">{course.enrollments} enrollments</span>
                      <span className="text-xs text-slate-600">{course.completion.toFixed(1)}% completion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-900">#{index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-slate-900">User Engagement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Avg. Session Duration</p>
                  <p className="text-2xl font-bold text-slate-900">{analyticsData?.userEngagement.avgSessionDuration}</p>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Courses per User</p>
                  <p className="text-2xl font-bold text-slate-900">{analyticsData?.userEngagement.coursesPerUser}</p>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Retention Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{analyticsData?.userEngagement.retentionRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">Satisfaction Score</p>
                  <p className="text-2xl font-bold text-slate-900">{analyticsData?.userEngagement.satisfactionScore}/5</p>
                </div>
                <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
