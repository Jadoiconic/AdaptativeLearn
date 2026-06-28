import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import {
  CourseModel,
  ProgressModel,
  QuizResultModel,
  ActivityModel,
  UserModel,
} from '@/database/models';
import mongoose from 'mongoose';

type StudentStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Needs Attention'
  | 'Completed'
  | 'Internship Ready';

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
  lastActive: Date | null;
  enrolledAt: Date | null;
  status: StudentStatus;
}

function computeStatus(
  progressPercentage: number,
  quizAverage: number,
  readinessScore: number,
  lastActive: Date | null
): StudentStatus {
  if (progressPercentage === 0) return 'Not Started';
  if (progressPercentage === 100 && quizAverage >= 80 && readinessScore >= 70) {
    return 'Internship Ready';
  }
  if (progressPercentage === 100) return 'Completed';
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (quizAverage > 0 && quizAverage < 60) return 'Needs Attention';
  if (!lastActive || lastActive < sevenDaysAgo) return 'Needs Attention';
  return 'In Progress';
}

function computeSummary(students: StudentRecord[]) {
  const total = students.length;
  if (total === 0) {
    return {
      totalStudents: 0,
      activeStudents: 0,
      completedStudents: 0,
      needsAttentionStudents: 0,
      internshipReadyStudents: 0,
      avgProgressPercentage: 0,
      avgQuizScore: 0,
    };
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const withQuiz = students.filter((s) => s.quizAverage > 0);
  return {
    totalStudents: total,
    activeStudents: students.filter(
      (s) => s.lastActive && new Date(s.lastActive) >= sevenDaysAgo
    ).length,
    completedStudents: students.filter(
      (s) => s.status === 'Completed' || s.status === 'Internship Ready'
    ).length,
    needsAttentionStudents: students.filter((s) => s.status === 'Needs Attention').length,
    internshipReadyStudents: students.filter((s) => s.status === 'Internship Ready').length,
    avgProgressPercentage: Math.round(
      students.reduce((sum, s) => sum + s.progressPercentage, 0) / total
    ),
    avgQuizScore: withQuiz.length
      ? Math.round(withQuiz.reduce((sum, s) => sum + s.quizAverage, 0) / withQuiz.length)
      : 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const instructorId =
      session.user.role === 'admin' && searchParams.get('instructorId')
        ? searchParams.get('instructorId')!
        : session.user.id;
    const filterCourseId = searchParams.get('courseId');

    // Query 1: instructor's courses
    const courseFilter: Record<string, unknown> = { instructorId };
    if (filterCourseId) {
      courseFilter._id = new mongoose.Types.ObjectId(filterCourseId);
    }
    const courses = await CourseModel.find(courseFilter)
      .select('_id title category moduleCount')
      .lean();

    if (courses.length === 0) {
      return NextResponse.json({ students: [], summary: computeSummary([]) });
    }

    const courseIds = courses.map((c) => c._id);
    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    // Query 2: progress aggregation
    const progressAgg = await ProgressModel.aggregate([
      { $match: { courseId: { $in: courseIds } } },
      {
        $group: {
          _id: { courseId: '$courseId', userId: '$userId' },
          completedModules: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          firstProgressAt: { $min: '$createdAt' },
        },
      },
    ]);

    if (progressAgg.length === 0) {
      return NextResponse.json({ students: [], summary: computeSummary([]) });
    }

    const enrollmentPairs = progressAgg.map((p) => ({
      courseId: p._id.courseId.toString(),
      userId: p._id.userId.toString(),
      completedModules: p.completedModules as number,
      firstProgressAt: p.firstProgressAt as Date | null,
    }));

    const uniqueStudentIds = [...new Set(enrollmentPairs.map((e) => e.userId))];
    const studentObjectIds = uniqueStudentIds.map((id) => new mongoose.Types.ObjectId(id));

    // Query 3: quiz result aggregation
    const quizAgg = await QuizResultModel.aggregate([
      { $match: { courseId: { $in: courseIds }, studentId: { $in: studentObjectIds } } },
      {
        $group: {
          _id: { courseId: '$courseId', studentId: '$studentId' },
          quizAverage: { $avg: '$percentage' },
        },
      },
    ]);
    const quizMap = new Map(
      quizAgg.map((q) => [
        `${q._id.courseId}|${q._id.studentId}`,
        Math.round(q.quizAverage ?? 0),
      ])
    );

    // Query 4: activity aggregation — lastActive and enrolledAt
    const activityAgg = await ActivityModel.aggregate([
      { $match: { courseId: { $in: courseIds }, userId: { $in: studentObjectIds } } },
      {
        $group: {
          _id: { courseId: '$courseId', userId: '$userId' },
          lastActive: { $max: '$createdAt' },
          enrolledAt: {
            $min: {
              $cond: [{ $eq: ['$activityType', 'enrolled'] }, '$createdAt', null],
            },
          },
        },
      },
    ]);
    const activityMap = new Map(
      activityAgg.map((a) => [
        `${a._id.courseId}|${a._id.userId}`,
        { lastActive: a.lastActive as Date | null, enrolledAt: a.enrolledAt as Date | null },
      ])
    );

    // Query 5: student user documents
    const studentDocs = await UserModel.find({ _id: { $in: studentObjectIds } })
      .select('name email avatar readinessScore')
      .lean();
    const studentMap = new Map(studentDocs.map((s) => [s._id.toString(), s]));

    // In-memory join
    const result: StudentRecord[] = enrollmentPairs
      .map((pair) => {
        const course = courseMap.get(pair.courseId);
        const student = studentMap.get(pair.userId);
        if (!course || !student) return null;

        const totalModules = (course as any).moduleCount ?? 0;
        const completedModules = pair.completedModules;
        const progressPercentage =
          totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        const qKey = `${pair.courseId}|${pair.userId}`;
        const quizAverage = quizMap.get(qKey) ?? 0;
        const actData = activityMap.get(qKey);
        const lastActive = actData?.lastActive ?? null;
        const enrolledAt = actData?.enrolledAt ?? pair.firstProgressAt ?? null;

        return {
          studentId: pair.userId,
          name: (student as any).name,
          email: (student as any).email,
          avatar: (student as any).avatar ?? '',
          readinessScore: (student as any).readinessScore ?? 0,
          courseId: pair.courseId,
          courseTitle: (course as any).title,
          courseCategory: (course as any).category,
          completedModules,
          totalModules,
          progressPercentage,
          quizAverage,
          lastActive,
          enrolledAt,
          status: computeStatus(
            progressPercentage,
            quizAverage,
            (student as any).readinessScore ?? 0,
            lastActive
          ),
        } satisfies StudentRecord;
      })
      .filter((r): r is StudentRecord => r !== null);

    return NextResponse.json({ students: result, summary: computeSummary(result) });
  } catch (error) {
    console.error('Get instructor students error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
