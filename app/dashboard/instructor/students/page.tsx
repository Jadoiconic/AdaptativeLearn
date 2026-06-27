'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StudentRecord {
  studentId: string;
  name: string;
  email: string;
  avatar: string;
  readinessScore: number;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  completedModules: number;
  totalModules: number;
  progressPercentage: number;
  quizAverage: number;
  lastActive: string | null;
  enrolledAt: string | null;
  status: string;
}

interface Summary {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  needsAttentionStudents: number;
  internshipReadyStudents: number;
  avgProgressPercentage: number;
  avgQuizScore: number;
}

interface CourseOption {
  _id: string;
  title: string;
}

interface ModuleProgress {
  moduleId: string;
  title: string;
  type: string;
  order: number;
  skillsCovered: string[];
  estimatedTime: string;
  status: string;
  score?: number;
  completedAt?: string;
}

interface CourseBreakdown {
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  quizAverage: number;
  skillGaps: string[];
  moduleProgress: ModuleProgress[];
}

interface QuizHistory {
  quizId: string;
  quizTitle: string;
  moduleId: string;
  moduleTitle: string;
  courseId: string;
  score: number;
  percentage: number;
  passed: boolean;
  completedAt: string;
  feedback?: { strengths: string[]; weaknesses: string[]; recommendations: string[] };
}

interface RecentActivity {
  activityType: string;
  courseTitle: string;
  moduleTitle: string | null;
  score?: number;
  createdAt: string;
}

interface StudentDetail {
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    skills: string[];
    readinessScore: number;
    placementAssessment: any;
    memberSince: string;
  };
  courseBreakdowns: CourseBreakdown[];
  quizHistory: QuizHistory[];
  recentActivities: RecentActivity[];
  insight: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  'All',
  'Not Started',
  'In Progress',
  'Needs Attention',
  'Completed',
  'Internship Ready',
];

function getStatusStyle(status: string): string {
  const map: Record<string, string> = {
    'Internship Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Completed': 'bg-green-100 text-green-700 border-green-200',
    'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'Needs Attention': 'bg-red-100 text-red-700 border-red-200',
    'Not Started': 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return map[status] ?? map['Not Started'];
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(dateStr).toLocaleDateString();
}

function activityLabel(type: string): string {
  const map: Record<string, string> = {
    enrolled: 'Enrolled in course',
    completed_module: 'Completed a module',
    submitted_quiz: 'Submitted a quiz',
    started_course: 'Started course',
  };
  return map[type] ?? type;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InstructorStudentsPage() {
  const { data: session } = useSession();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!session?.user?.id) return;
    const res = await fetch(`/api/courses?instructorId=${session.user.id}`);
    const data = await res.json();
    if (data.success) {
      setCourses(data.courses.map((c: any) => ({ _id: c._id, title: c.title })));
    }
  }, [session?.user?.id]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourse) params.set('courseId', selectedCourse);
      const res = await fetch(`/api/instructor/students?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students ?? []);
        setSummary(data.summary ?? null);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourse]);

  const fetchStudentDetail = useCallback(async (studentId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/instructor/students/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(data);
      }
    } catch (err) {
      console.error('Error fetching student detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (selectedStudentId) {
      fetchStudentDetail(selectedStudentId);
    } else {
      setDetailData(null);
    }
  }, [selectedStudentId, fetchStudentDetail]);

  const q = searchQuery.toLowerCase();
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const closePanel = () => {
    setSelectedStudentId(null);
    setDetailData(null);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
        <p className="text-slate-600 mt-1">
          Monitor enrollment, progress, and internship readiness across all your courses.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {loading ? '—' : (summary?.totalStudents ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            {!loading && summary && (
              <p className="text-xs text-slate-500 mt-2">{summary.activeStudents} active this week</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Active Learners</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {loading ? '—' : (summary?.activeStudents ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            {!loading && summary && (
              <p className="text-xs text-slate-500 mt-2">avg {summary.avgProgressPercentage}% progress</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Needs Attention</p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {loading ? '—' : (summary?.needsAttentionStudents ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            {!loading && summary && (
              <p className="text-xs text-slate-500 mt-2">struggling or inactive</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">
                  {loading ? '—' : (summary?.completedStudents ?? 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            {!loading && summary && (
              <p className="text-xs text-slate-500 mt-2">{summary.internshipReadyStudents} internship ready</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/60 mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                  statusFilter === tab
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Table */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-slate-900">
            Students {!loading && `(${filteredStudents.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No students found</h3>
              <p className="text-slate-500 text-sm text-center max-w-sm">
                {students.length === 0
                  ? 'No students are enrolled in your courses yet.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide" style={{ minWidth: 160 }}>Progress</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quiz Avg</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Readiness</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Active</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr
                      key={`${student.studentId}-${student.courseId}`}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedStudentId(student.studentId)}
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {student.avatar ? (
                              <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-blue-700">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{student.name}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-800">{student.courseTitle}</div>
                        <div className="text-xs text-slate-400">{student.courseCategory}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-full h-1.5" style={{ minWidth: 80 }}>
                            <div
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                student.progressPercentage === 100
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{ width: `${student.progressPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 tabular-nums w-8 text-right">
                            {student.progressPercentage}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {student.completedModules}/{student.totalModules} modules
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-bold ${
                          student.quizAverage >= 80
                            ? 'text-green-600'
                            : student.quizAverage >= 60
                            ? 'text-blue-600'
                            : student.quizAverage > 0
                            ? 'text-red-600'
                            : 'text-slate-400'
                        }`}>
                          {student.quizAverage > 0 ? `${student.quizAverage}%` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-slate-700">
                          {student.readinessScore > 0 ? `${student.readinessScore}%` : '—'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-500">
                        {formatRelativeTime(student.lastActive)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(student.status)}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedStudentId(student.studentId); }}
                          className="text-blue-600 hover:text-blue-800 text-xs font-semibold whitespace-nowrap"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overlay */}
      {selectedStudentId && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={closePanel}
        />
      )}

      {/* Slide-in Detail Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${
          selectedStudentId ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedStudentId && (
          detailLoading ? (
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : detailData ? (
            <div className="p-8 space-y-7">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {detailData.student.avatar ? (
                      <img src={detailData.student.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-blue-700">
                        {detailData.student.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{detailData.student.name}</h2>
                    <p className="text-sm text-slate-500">{detailData.student.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {detailData.student.readinessScore > 0 && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 font-medium">
                          Readiness: {detailData.student.readinessScore}%
                        </span>
                      )}
                      {detailData.student.placementAssessment?.recommendedLevel && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200 font-medium capitalize">
                          {detailData.student.placementAssessment.recommendedLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closePanel}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Insight Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Instructor Insight</p>
                <p className="text-sm text-amber-800 leading-relaxed">{detailData.insight}</p>
              </div>

              {/* Course Breakdowns */}
              {detailData.courseBreakdowns.map((cb) => (
                <div key={cb.courseId} className="border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{cb.courseTitle}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{cb.courseCategory}</p>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{cb.progressPercentage}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        cb.progressPercentage === 100
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                      style={{ width: `${cb.progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>{cb.completedModules}/{cb.totalModules} modules</span>
                    {cb.quizAverage > 0 && (
                      <span className={`font-semibold ${cb.quizAverage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                        Quiz avg: {cb.quizAverage}%
                      </span>
                    )}
                  </div>

                  {/* Module list */}
                  <div className="space-y-1.5">
                    {cb.moduleProgress.map((mod) => (
                      <div key={mod.moduleId} className="flex items-center gap-2.5 text-sm">
                        <span className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
                          mod.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : mod.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {mod.status === 'completed' ? '✓' : mod.status === 'in-progress' ? '▶' : '○'}
                        </span>
                        <span className="flex-1 text-slate-700 truncate">{mod.title}</span>
                        <span className="text-slate-400 text-xs capitalize flex-shrink-0">{mod.type}</span>
                        {mod.score != null && (
                          <span className="text-xs font-semibold text-slate-600 flex-shrink-0">{mod.score}%</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Skill gaps */}
                  {cb.skillGaps.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills to develop</p>
                      <div className="flex flex-wrap gap-1.5">
                        {cb.skillGaps.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full border border-orange-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Quiz History */}
              {detailData.quizHistory.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Quiz History</h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left py-2.5 px-4 font-medium text-slate-600 text-xs">Module</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-600 text-xs">Score</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-600 text-xs">Result</th>
                          <th className="text-left py-2.5 px-4 font-medium text-slate-600 text-xs">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailData.quizHistory.map((qr, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0">
                            <td className="py-2.5 px-4 text-slate-700">{qr.moduleTitle}</td>
                            <td className="py-2.5 px-4">
                              <span className={`font-bold ${qr.passed ? 'text-green-600' : 'text-red-600'}`}>
                                {qr.percentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                qr.passed
                                  ? 'bg-green-100 text-green-700 border-green-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                              }`}>
                                {qr.passed ? 'Passed' : 'Failed'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-400 text-xs">
                              {new Date(qr.completedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {detailData.recentActivities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {detailData.recentActivities.slice(0, 8).map((a, i) => (
                      <div key={i} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                        <div className="flex-1 min-w-0">
                          <span className="text-slate-700">{activityLabel(a.activityType)}</span>
                          {a.moduleTitle && (
                            <span className="text-slate-500"> · {a.moduleTitle}</span>
                          )}
                          {a.score != null && (
                            <span className="text-slate-500"> · {a.score}%</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0">
                          {formatRelativeTime(a.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Student skills */}
              {detailData.student.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-3">Known Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {detailData.student.skills.map((skill) => (
                      <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
