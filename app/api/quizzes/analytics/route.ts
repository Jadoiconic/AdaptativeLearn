import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { QuizResultModel, QuizModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'admin' && session.user.role !== 'instructor') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Instructor or Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const moduleId = searchParams.get('moduleId');
    const courseId = searchParams.get('courseId');
    
    if (!quizId && !moduleId && !courseId) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID, Module ID, or Course ID is required' },
        { status: 400 }
      );
    }

    const filter: any = {};
    if (quizId) filter.quizId = quizId;
    if (moduleId) filter.moduleId = moduleId;
    if (courseId) filter.courseId = courseId;

    // Get all quiz results for the filter
    const results = await QuizResultModel.find(filter)
      .populate('quizId', 'title questions')
      .populate('moduleId', 'title')
      .populate('studentId', 'name email')
      .lean<any[]>();

    if (results.length === 0) {
      return NextResponse.json({
        success: true,
        analytics: {
          totalAttempts: 0,
          averageScore: 0,
          passRate: 0,
          averageTime: 0,
          difficultyBreakdown: {},
          levelDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
          weakTopics: [],
          strongTopics: [],
        },
      });
    }

    // Calculate analytics
    const totalAttempts = results.length;
    const averageScore = results.reduce((sum, r) => sum + r.percentage, 0) / totalAttempts;
    const passRate = (results.filter(r => r.passed).length / totalAttempts) * 100;
    const averageTime = results.reduce((sum, r) => sum + r.timeTaken, 0) / totalAttempts;

    // Level distribution
    const levelDistribution = results.reduce((acc, r) => {
      acc[r.recommendedLevel] = (acc[r.recommendedLevel] || 0) + 1;
      return acc;
    }, { beginner: 0, intermediate: 0, advanced: 0 });

    // Difficulty breakdown (if quiz data available)
    const difficultyBreakdown: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const firstQuiz = results[0]?.quizId as any;
    if (firstQuiz?.questions) {
      const questions: any[] = firstQuiz.questions;
      questions.forEach((q) => {
        const correctCount = results.filter((r) =>
          r.answers.find((a: any) => a.questionId === q.id && a.isCorrect)
        ).length;
        difficultyBreakdown[q.difficulty] = {
          total: totalAttempts,
          correct: correctCount,
          accuracy: (correctCount / totalAttempts) * 100,
        };
      });
    }

    // Identify weak and strong topics based on question performance
    const weakTopics: string[] = [];
    const strongTopics: string[] = [];

    if (firstQuiz?.questions) {
      const questions: any[] = firstQuiz.questions;
      questions.forEach((q) => {
        const correctCount = results.filter((r) =>
          r.answers.find((a: any) => a.questionId === q.id && a.isCorrect)
        ).length;
        const accuracy = (correctCount / totalAttempts) * 100;

        if (accuracy < 50) {
          weakTopics.push(`${q.difficulty}: ${q.question.substring(0, 50)}...`);
        } else if (accuracy > 80) {
          strongTopics.push(`${q.difficulty}: ${q.question.substring(0, 50)}...`);
        }
      });
    }

    // Readiness statistics
    const readyForAdvanced = levelDistribution.advanced / totalAttempts * 100;
    const readyForIntermediate = (levelDistribution.intermediate + levelDistribution.advanced) / totalAttempts * 100;

    return NextResponse.json({
      success: true,
      analytics: {
        totalAttempts,
        averageScore: Math.round(averageScore * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        averageTime: Math.round(averageTime),
        difficultyBreakdown,
        levelDistribution,
        weakTopics: weakTopics.slice(0, 5),
        strongTopics: strongTopics.slice(0, 5),
        readiness: {
          readyForAdvanced: Math.round(readyForAdvanced * 10) / 10,
          readyForIntermediate: Math.round(readyForIntermediate * 10) / 10,
          needsBeginner: Math.round(levelDistribution.beginner / totalAttempts * 100 * 10) / 10,
        },
        recentResults: results.slice(0, 10).map((r) => ({
          studentName: (r.studentId as any)?.name,
          score: r.percentage,
          passed: r.passed,
          level: r.recommendedLevel,
          completedAt: r.completedAt,
        })),
      },
    });
  } catch (error) {
    console.error('Get quiz analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
