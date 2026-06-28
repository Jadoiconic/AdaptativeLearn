import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, ProgressModel, QuizResultModel, SkillGapAnalysisModel } from '@/database/models';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [user, progressRecords, quizResults, latestAnalysis] = await Promise.all([
      UserModel.findById(session.user.id).select('placementAssessment readinessScore'),
      ProgressModel.find({ userId: session.user.id }),
      QuizResultModel.find({ studentId: session.user.id }),
      SkillGapAnalysisModel.findOne({ userId: session.user.id }).sort({ generatedAt: -1 }),
    ]);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // ─── Placement score (0-100) ───────────────────────────────────────────────
    const placementScore = user.placementAssessment?.score ?? 0;

    // ─── Quiz average (0-100) ──────────────────────────────────────────────────
    const quizAvg =
      quizResults.length > 0
        ? quizResults.reduce((sum, r) => sum + r.percentage, 0) / quizResults.length
        : 0;

    // ─── Module completion rate (0-100) ───────────────────────────────────────
    const completedModules = progressRecords.filter((p) => p.status === 'completed').length;
    const completionRate = progressRecords.length > 0 ? (completedModules / progressRecords.length) * 100 : 0;

    // ─── Skill coverage (0-100) from latest AI analysis ───────────────────────
    const skillCoverage = latestAnalysis?.readinessScores.technicalSkills ?? placementScore;

    // ─── Multi-dimensional readiness scores ───────────────────────────────────
    // Technical Skills: weighted blend of quiz performance + placement score + skill coverage
    const technicalSkills = Math.round(quizAvg * 0.4 + placementScore * 0.35 + skillCoverage * 0.25);

    // Practical Readiness: how much the learner has actually completed
    const practicalReadiness = Math.round(completionRate * 0.6 + quizAvg * 0.25 + placementScore * 0.15);

    // Internship Readiness: blend of technical and practical with skill coverage
    const internshipReadiness = Math.round(
      technicalSkills * 0.45 + practicalReadiness * 0.35 + skillCoverage * 0.2
    );

    // Overall: weighted average of all three
    const overall = Math.round(technicalSkills * 0.35 + practicalReadiness * 0.35 + internshipReadiness * 0.3);

    return NextResponse.json({
      success: true,
      readiness: {
        technicalSkills: Math.min(100, technicalSkills),
        practicalReadiness: Math.min(100, practicalReadiness),
        internshipReadiness: Math.min(100, internshipReadiness),
        overall: Math.min(100, overall),
      },
      meta: {
        placementScore,
        quizAverage: Math.round(quizAvg),
        moduleCompletionRate: Math.round(completionRate),
        quizCount: quizResults.length,
        modulesCompleted: completedModules,
        totalModules: progressRecords.length,
      },
    });
  } catch (error) {
    console.error('GET /api/ai/readiness error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
