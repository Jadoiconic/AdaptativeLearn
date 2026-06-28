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

function generateInsight(courseBreakdowns: any[], activities: any[]): string {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hasRecentActivity = activities.some((a) => new Date(a.createdAt) >= sevenDaysAgo);
  const allComplete = courseBreakdowns.length > 0 && courseBreakdowns.every((cb) => cb.progressPercentage === 100);
  const avgQuiz =
    courseBreakdowns.length > 0
      ? courseBreakdowns.reduce((s, cb) => s + cb.quizAverage, 0) / courseBreakdowns.length
      : 0;
  const allSkillGaps = courseBreakdowns.flatMap((cb) => cb.skillGaps as string[]);

  if (allComplete && avgQuiz >= 80) {
    return 'Excellent performance — student has completed all enrolled courses with strong quiz scores and may be internship-ready.';
  }
  if (!hasRecentActivity && courseBreakdowns.length > 0) {
    return 'Student has had no activity in the past 7 days. Consider reaching out to re-engage.';
  }
  if (avgQuiz > 0 && avgQuiz < 60) {
    const weakCourses = courseBreakdowns
      .filter((cb) => cb.quizAverage > 0 && cb.quizAverage < 60)
      .map((cb) => cb.courseTitle)
      .join(', ');
    return `Student is struggling with quiz performance (average ${Math.round(avgQuiz)}%) in: ${weakCourses}. Review their quiz feedback and consider additional support.`;
  }
  if (allSkillGaps.length > 0) {
    const shown = allSkillGaps.slice(0, 5).join(', ');
    const extra = allSkillGaps.length > 5 ? ` and ${allSkillGaps.length - 5} more` : '';
    return `Student still needs to develop these skills: ${shown}${extra}.`;
  }
  return 'Student is progressing normally through the course material.';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'instructor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await connectDB();

    const { studentId } = await params;
    const { searchParams } = new URL(request.url);

    const instructorId =
      session.user.role === 'admin' && searchParams.get('instructorId')
        ? searchParams.get('instructorId')!
        : session.user.id;

    const student = await UserModel.findById(studentId)
      .select('name email avatar skills readinessScore placementAssessment createdAt')
      .lean();
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const instructorCourses = await CourseModel.find({ instructorId })
      .select('_id title category skillsCovered moduleCount')
      .lean();

    const instructorCourseIds = instructorCourses.map((c) => c._id);

    // Security: confirm student is enrolled in at least one instructor course
    const enrolledCheck = await ProgressModel.findOne({
      userId: new mongoose.Types.ObjectId(studentId),
      courseId: { $in: instructorCourseIds },
    }).lean();
    if (!enrolledCheck) {
      return NextResponse.json(
        { error: 'Student is not enrolled in any of your courses' },
        { status: 403 }
      );
    }

    const [progressRecords, quizResults, activities] = await Promise.all([
      ProgressModel.find({
        userId: new mongoose.Types.ObjectId(studentId),
        courseId: { $in: instructorCourseIds },
      })
        .populate('moduleId', 'title type order skillsCovered estimatedTime')
        .populate('courseId', 'title category')
        .sort({ 'moduleId.order': 1 })
        .lean(),

      QuizResultModel.find({
        studentId: new mongoose.Types.ObjectId(studentId),
        courseId: { $in: instructorCourseIds },
      })
        .populate('moduleId', 'title type order')
        .populate('quizId', 'title')
        .sort({ completedAt: -1 })
        .lean(),

      ActivityModel.find({
        userId: new mongoose.Types.ObjectId(studentId),
        courseId: { $in: instructorCourseIds },
      })
        .populate('courseId', 'title')
        .populate('moduleId', 'title')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ]);

    // Group progress by courseId
    const progressByCourse = new Map<string, typeof progressRecords>();
    for (const p of progressRecords) {
      const cid =
        typeof p.courseId === 'object' && p.courseId !== null && '_id' in p.courseId
          ? (p.courseId as any)._id.toString()
          : p.courseId.toString();
      if (!progressByCourse.has(cid)) progressByCourse.set(cid, []);
      progressByCourse.get(cid)!.push(p);
    }

    const courseBreakdowns = instructorCourses
      .filter((c) => progressByCourse.has(c._id.toString()))
      .map((course) => {
        const courseProgress = progressByCourse.get(course._id.toString()) ?? [];
        const completedSkills = new Set<string>();
        let completedCount = 0;

        for (const p of courseProgress) {
          if (p.status === 'completed') {
            completedCount++;
            const mod = p.moduleId as any;
            (mod?.skillsCovered ?? []).forEach((s: string) => completedSkills.add(s));
          }
        }

        const skillGaps = ((course as any).skillsCovered ?? []).filter(
          (s: string) => !completedSkills.has(s)
        );
        const totalModules = (course as any).moduleCount ?? 0;
        const progressPercentage =
          totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

        const courseQuizResults = quizResults.filter((qr) => {
          const rawCid = qr.courseId as any;
          const qCourseId =
            rawCid && typeof rawCid === 'object' && '_id' in rawCid
              ? rawCid._id.toString()
              : String(rawCid);
          return qCourseId === course._id.toString();
        });
        const quizAverage =
          courseQuizResults.length > 0
            ? Math.round(
                courseQuizResults.reduce((s, qr) => s + qr.percentage, 0) /
                  courseQuizResults.length
              )
            : 0;

        return {
          courseId: course._id.toString(),
          courseTitle: (course as any).title,
          courseCategory: (course as any).category,
          totalModules,
          completedModules: completedCount,
          progressPercentage,
          quizAverage,
          skillGaps,
          moduleProgress: courseProgress
            .map((p) => {
              const mod = p.moduleId as any;
              return {
                moduleId: mod?._id?.toString() ?? p.moduleId.toString(),
                title: mod?.title ?? 'Unknown Module',
                type: mod?.type ?? 'lesson',
                order: mod?.order ?? 0,
                skillsCovered: mod?.skillsCovered ?? [],
                estimatedTime: mod?.estimatedTime ?? '',
                status: p.status,
                score: p.score,
                timeSpent: p.timeSpent,
                completedAt: p.completedAt,
              };
            })
            .sort((a, b) => a.order - b.order),
        };
      });

    const insight = generateInsight(courseBreakdowns, activities);

    return NextResponse.json({
      student: {
        id: studentId,
        name: (student as any).name,
        email: (student as any).email,
        avatar: (student as any).avatar ?? '',
        skills: (student as any).skills ?? [],
        readinessScore: (student as any).readinessScore ?? 0,
        placementAssessment: (student as any).placementAssessment ?? null,
        memberSince: (student as any).createdAt,
      },
      courseBreakdowns,
      quizHistory: quizResults.map((qr) => ({
        quizId: qr.quizId?.toString() ?? '',
        quizTitle: (qr.quizId as any)?.title ?? 'Quiz',
        moduleId: qr.moduleId?.toString() ?? '',
        moduleTitle: (qr.moduleId as any)?.title ?? 'Unknown Module',
        courseId: qr.courseId?.toString() ?? '',
        score: qr.score,
        percentage: qr.percentage,
        passed: qr.passed,
        completedAt: qr.completedAt,
        feedback: qr.feedback,
      })),
      recentActivities: activities.map((a) => ({
        activityType: a.activityType,
        courseTitle: (a.courseId as any)?.title ?? '',
        moduleTitle: (a.moduleId as any)?.title ?? null,
        score: a.score,
        createdAt: a.createdAt,
      })),
      insight,
    });
  } catch (error) {
    console.error('Get student detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
