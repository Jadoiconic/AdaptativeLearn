import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel } from '@/database/models';
import { IPlacementQuizQuestion } from '@/database/models/User';

// A tier counts as "passed" once the learner gets at least half of its questions right.
const MASTERY_THRESHOLD = 0.5;

interface SubmittedAnswer {
  questionId: string;
  selectedAnswer: string | string[];
}

function isAnswerCorrect(selected: string | string[] | undefined, correct: string | string[]): boolean {
  const normalize = (value: string) => value.trim().toLowerCase();
  const selectedValues = (Array.isArray(selected) ? selected : [selected || '']).map(normalize).filter(Boolean);
  if (selectedValues.length === 0) return false;

  const correctValues = (Array.isArray(correct) ? correct : [correct]).map(normalize);

  return selectedValues.some((sel) =>
    correctValues.some((c) => sel === c || sel.includes(c) || c.includes(sel))
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { answers } = body as { answers: SubmittedAnswer[] };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'Answers are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.placementAssessment?.completed) {
      return NextResponse.json(
        { success: false, error: 'Placement assessment already completed' },
        { status: 409 }
      );
    }

    const draftQuestions = user.placementQuizDraft?.questions;
    if (!draftQuestions || draftQuestions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No active placement assessment found. Please generate a new one.' },
        { status: 400 }
      );
    }

    // Grade every question against the server-held answer key — never trust
    // client-reported correctness, since the client only has the question text.
    const answerByQuestionId = new Map(answers.map((a) => [a.questionId, a.selectedAnswer]));

    const tierTotals: Record<IPlacementQuizQuestion['level'], number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };
    const tierCorrect: Record<IPlacementQuizQuestion['level'], number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    let totalPoints = 0;
    let earnedPoints = 0;
    let correctCount = 0;

    for (const question of draftQuestions) {
      const selected = answerByQuestionId.get(question.id);
      const correct = isAnswerCorrect(selected, question.correctAnswer);

      totalPoints += question.points;
      tierTotals[question.level] += 1;

      if (correct) {
        earnedPoints += question.points;
        tierCorrect[question.level] += 1;
        correctCount += 1;
      }
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const tierAccuracy = (level: IPlacementQuizQuestion['level']) =>
      tierTotals[level] > 0 ? tierCorrect[level] / tierTotals[level] : 0;

    const beginnerAccuracy = tierAccuracy('beginner');
    const intermediateAccuracy = tierAccuracy('intermediate');
    const advancedAccuracy = tierAccuracy('advanced');

    // Tier-mastery placement: a learner is promoted to the next level only after
    // demonstrating competence at every level below it.
    let recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
    if (beginnerAccuracy < MASTERY_THRESHOLD || intermediateAccuracy < MASTERY_THRESHOLD) {
      recommendedLevel = 'beginner';
    } else if (advancedAccuracy < MASTERY_THRESHOLD) {
      recommendedLevel = 'intermediate';
    } else {
      recommendedLevel = 'advanced';
    }

    const feedback = generatePlacementFeedback({
      beginnerAccuracy,
      intermediateAccuracy,
      advancedAccuracy,
      correctCount,
      totalCount: draftQuestions.length,
    });

    user.placementAssessment = {
      completed: true,
      score: Math.round(percentage * 10) / 10,
      recommendedLevel,
      completedAt: new Date(),
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
    };
    user.placementQuizDraft = undefined;

    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Placement assessment submitted successfully',
      result: user.placementAssessment,
    });
  } catch (error) {
    console.error('Submit placement assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generatePlacementFeedback({
  beginnerAccuracy,
  intermediateAccuracy,
  advancedAccuracy,
  correctCount,
  totalCount,
}: {
  beginnerAccuracy: number;
  intermediateAccuracy: number;
  advancedAccuracy: number;
  correctCount: number;
  totalCount: number;
}) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (beginnerAccuracy >= MASTERY_THRESHOLD) {
    strengths.push('Solid grasp of fundamental concepts');
  } else {
    weaknesses.push('Fundamental/beginner concepts need reinforcement');
  }

  if (intermediateAccuracy >= MASTERY_THRESHOLD) {
    strengths.push('Comfortable applying concepts to practical problems');
  } else if (beginnerAccuracy >= MASTERY_THRESHOLD) {
    weaknesses.push('Applied, intermediate-level problem-solving needs more practice');
  }

  if (advancedAccuracy >= MASTERY_THRESHOLD) {
    strengths.push('Capable of advanced reasoning and design tradeoffs');
  } else if (intermediateAccuracy >= MASTERY_THRESHOLD) {
    weaknesses.push('Advanced topics (architecture, performance, concurrency) are still developing');
  }

  if (correctCount / totalCount >= 0.8) {
    strengths.push('Strong overall accuracy across the assessment');
  }

  return { strengths, weaknesses };
}
