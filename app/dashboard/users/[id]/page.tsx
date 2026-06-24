'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface EducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: EducationEntry[];
  careerGoals?: string;
  placementAssessment?: {
    completed: boolean;
    score?: number;
    recommendedLevel?: string;
  };
  createdAt?: string;
}

interface ProgressSummary {
  modulesStarted: number;
  modulesCompleted: number;
  averageScore: number;
  totalTimeSpentMinutes: number;
}

export default function LearnerProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id as string;

  const [user, setUser] = useState<LearnerProfile | null>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to load profile');
        }
        const data = await response.json();
        setUser(data.user);
        setProfileCompletion(data.profileCompletion ?? 0);
        setProgressSummary(data.progressSummary ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="max-w-5xl mx-auto text-center py-16">
        <p className="text-lg font-medium text-slate-900 mb-2">{error || 'Profile not found'}</p>
        <Button variant="outline" onClick={() => router.push('/dashboard/users')}>
          Back to Users
        </Button>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/users" className="text-sm text-blue-600 hover:underline">
          ← Back to Users
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-gray-200">
            <CardContent className="pt-6 text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-500 font-semibold">{initials}</span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                {user.role}
              </span>
              {user.phone && <p className="text-sm text-gray-600 mt-3">{user.phone}</p>}
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900 text-base">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Completion</span>
                <span className="text-sm font-semibold text-blue-700">{profileCompletion}%</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {progressSummary && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 text-base">Progress Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Modules Started</span>
                  <span className="text-sm font-medium text-gray-900">{progressSummary.modulesStarted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Modules Completed</span>
                  <span className="text-sm font-medium text-gray-900">{progressSummary.modulesCompleted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Score</span>
                  <span className="text-sm font-medium text-gray-900">{progressSummary.averageScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Time Spent</span>
                  <span className="text-sm font-medium text-gray-900">
                    {progressSummary.totalTimeSpentMinutes} min
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {user.placementAssessment?.completed && (
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 text-base">Placement Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Score</span>
                  <span className="text-sm font-medium text-gray-900">{user.placementAssessment.score}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Level</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {user.placementAssessment.recommendedLevel}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-wrap">{user.bio || 'No bio provided.'}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Career Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-wrap">{user.careerGoals || 'No career goals provided.'}</p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Skills & Interests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {(user.skills || []).length > 0 ? (
                    user.skills!.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No skills added.</p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {(user.interests || []).length > 0 ? (
                    user.interests!.map((interest) => (
                      <span
                        key={interest}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No interests added.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(user.education || []).length > 0 ? (
                user.education!.map((entry, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <p className="font-medium text-gray-900">{entry.institution}</p>
                    <p className="text-sm text-gray-600">
                      {[entry.degree, entry.fieldOfStudy].filter(Boolean).join(', ')}
                    </p>
                    {(entry.startYear || entry.endYear) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {entry.startYear || '—'} - {entry.endYear || 'Present'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No education history added.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
