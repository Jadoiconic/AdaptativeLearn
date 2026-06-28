import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { QuizModel, QuizResultModel } from '@/database/models';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'student') {
      return NextResponse.json(
        { success: false, error: 'Only students can submit quiz answers' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { quizId, answers, timeTaken, startedAt } = body;

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { success: false, error: 'Quiz ID and answers are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get the quiz
    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (quiz.status !== 'published') {
      return NextResponse.json(
        { success: false, error: 'Quiz is not published yet' },
        { status: 400 }
      );
    }

    // Check if student already submitted this quiz
    const existingSubmission = await QuizResultModel.findOne({
      quizId,
      studentId: session.user.id,
    });

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted this quiz', result: existingSubmission },
        { status: 409 }
      );
    }

    // Calculate score and process answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const processedAnswers = answers.map((answer: any) => {
      const question = quiz.questions.find((q: any) => q.id === answer.questionId);
      if (!question) return null;

      totalPoints += question.points;

      let isCorrect = false;
      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        isCorrect = answer.selectedAnswer === question.correctAnswer;
      } else if (question.type === 'short-answer') {
        // Case-insensitive comparison for short answers
        isCorrect = String(answer.selectedAnswer).toLowerCase().trim() === 
                   String(question.correctAnswer).toLowerCase().trim();
      }

      if (isCorrect) {
        earnedPoints += question.points;
      }

      return {
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
        timeSpent: answer.timeSpent || 0,
      };
    }).filter(Boolean);

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Determine recommended level based on score
    let recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
    if (percentage < 50) {
      recommendedLevel = 'beginner';
    } else if (percentage < 75) {
      recommendedLevel = 'intermediate';
    } else {
      recommendedLevel = 'advanced';
    }

    // Generate feedback
    const feedback = generateFeedback(quiz.questions, processedAnswers, percentage);

    // Save quiz result
    const quizResult = new QuizResultModel({
      quizId,
      moduleId: quiz.moduleId,
      courseId: quiz.courseId,
      studentId: session.user.id,
      answers: processedAnswers,
      score: earnedPoints,
      totalPoints,
      percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
      passed,
      timeTaken: timeTaken || 0,
      startedAt: new Date(startedAt || Date.now()),
      completedAt: new Date(),
      recommendedLevel,
      feedback,
    });

    await quizResult.save();

    return NextResponse.json({
      success: true,
      message: 'Quiz submitted successfully',
      result: quizResult,
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateFeedback(questions: any[], answers: any[], percentage: number) {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  // Analyze by difficulty
  const easyQuestions = questions.filter((q: any) => q.difficulty === 'easy');
  const mediumQuestions = questions.filter((q: any) => q.difficulty === 'medium');
  const hardQuestions = questions.filter((q: any) => q.difficulty === 'hard');

  const easyCorrect = answers.filter((a: any) => {
    const q = questions.find((q: any) => q.id === a.questionId);
    return q?.difficulty === 'easy' && a.isCorrect;
  }).length;

  const mediumCorrect = answers.filter((a: any) => {
    const q = questions.find((q: any) => q.id === a.questionId);
    return q?.difficulty === 'medium' && a.isCorrect;
  }).length;

  const hardCorrect = answers.filter((a: any) => {
    const q = questions.find((q: any) => q.id === a.questionId);
    return q?.difficulty === 'hard' && a.isCorrect;
  }).length;

  // Generate strengths
  if (easyCorrect / easyQuestions.length >= 0.8) {
    strengths.push('Strong foundation in basic concepts');
  }
  if (mediumCorrect / mediumQuestions.length >= 0.7) {
    strengths.push('Good understanding of intermediate topics');
  }
  if (hardCorrect / hardQuestions.length >= 0.6) {
    strengths.push('Excellent grasp of advanced concepts');
  }

  // Generate weaknesses
  if (easyCorrect / easyQuestions.length < 0.6) {
    weaknesses.push('Basic concepts need reinforcement');
  }
  if (mediumCorrect / mediumQuestions.length < 0.5) {
    weaknesses.push('Intermediate topics require more study');
  }
  if (hardCorrect / hardQuestions.length < 0.4) {
    weaknesses.push('Advanced concepts need more practice');
  }

  // Generate recommendations based on score
  if (percentage >= 80) {
    recommendations.push('You have excellent knowledge of this subject. You can proceed to advanced topics.');
  } else if (percentage >= 60) {
    recommendations.push('You have a good foundation. Review the intermediate concepts before moving forward.');
  } else if (percentage >= 40) {
    recommendations.push('Start with beginner materials and build your foundation before attempting advanced topics.');
  } else {
    recommendations.push('We recommend starting from the basics and taking this course from the beginning.');
  }

  // Add specific topic recommendations
  const incorrectAnswers = answers.filter((a: any) => !a.isCorrect);
  if (incorrectAnswers.length > 0) {
    recommendations.push(`Focus on the ${incorrectAnswers.length} questions you answered incorrectly.`);
  }

  return {
    strengths,
    weaknesses,
    recommendations,
  };
}
