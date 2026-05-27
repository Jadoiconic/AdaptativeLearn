'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalModules: number;
  activeUsers: number;
  completionRate: number;
  averageScore: number;
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockStats: DashboardStats = {
        totalUsers: 150,
        totalCourses: 12,
        totalModules: 48,
        activeUsers: 89,
        completionRate: 73.5,
        averageScore: 82.3,
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex space-x-2">
          <Button variant="outline">Export Report</Button>
          <Button onClick={() => router.push('/dashboard/admin/users')}>Manage Users</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-sm text-gray-600">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalCourses || 0}</div>
            <p className="text-sm text-gray-600">Available courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalModules || 0}</div>
            <p className="text-sm text-gray-600">Learning modules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-sm text-gray-600">Users this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.completionRate || 0}%</div>
            <p className="text-sm text-gray-600">Average completion</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.averageScore || 0}</div>
            <p className="text-sm text-gray-600">Across all assessments</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">New user registration</p>
                  <p className="text-sm text-gray-600">John Doe joined as Student</p>
                </div>
                <span className="text-sm text-gray-500">2 hours ago</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Course published</p>
                  <p className="text-sm text-gray-600">Advanced React Development</p>
                </div>
                <span className="text-sm text-gray-500">5 hours ago</span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">Module completed</p>
                  <p className="text-sm text-gray-600">15 students completed JavaScript Basics</p>
                </div>
                <span className="text-sm text-gray-500">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                Manage Users
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Create Course
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
