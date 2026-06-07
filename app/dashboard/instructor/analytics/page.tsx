// app/dashboard/instructor/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AssessmentStats {
  totalAssessments: number;
  averageScore: number;
  recentActivities: Array<{
    studentName: string;
    moduleTitle: string;
    score: number;
    submittedAt: string;
  }>;
}

export default function InstructorAnalytics() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AssessmentStats | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/assessments?instructorId=${session.user.id}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [session]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <p className="text-center text-gray-600">No analytics data available.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          onClick={() => router.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Assessment Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="text-indigo-800">Total Assessments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-indigo-900">{stats.totalAssessments}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardHeader>
            <CardTitle className="text-green-800">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-green-900">{stats?.averageScore ? stats.averageScore.toFixed(1) : '0'} / 100</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-xl font-medium text-gray-800 mb-4">Recent Assessment Activity</h2>
        <div className="space-y-4">
          {(stats.recentActivities ?? []).map((act, idx) => (
            <Card key={idx} className="border-l-4 border-blue-500 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{act.studentName}</span> submitted
                  <span className="font-medium text-gray-800"> {act.moduleTitle}</span> with a score of
                  <span className="font-medium text-gray-800"> {act.score}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-1">{new Date(act.submittedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <button
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        onClick={() => router.back()}
      >
        Back to Dashboard
      </button>
    </div>
  );
}
