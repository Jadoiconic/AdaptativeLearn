import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { QuizModel, CourseModel } from '@/database/models';

// GET - Get specific quiz by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { quizId } = await params;
    await connectDB();

    const quiz = await QuizModel.findById(quizId)
      .populate('moduleId', 'title')
      .populate('courseId', 'title');

    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor') {
      const course = await CourseModel.findById(quiz.courseId);
      if (!course || course.instructorId.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to view this quiz' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Get quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update quiz
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
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

    const { quizId } = await params;
    await connectDB();

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor') {
      const course = await CourseModel.findById(quiz.courseId);
      if (!course || course.instructorId.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to edit this quiz' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { title, description, questions, passingScore, timeLimit, status } = body;

    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (questions !== undefined) quiz.questions = questions;
    if (passingScore !== undefined) quiz.passingScore = passingScore;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (status !== undefined) {
      quiz.status = status;
      if (status === 'published') {
        quiz.generatedBy = 'manual';
      }
    }

    await quiz.save();

    return NextResponse.json({
      success: true,
      message: 'Quiz updated successfully',
      quiz,
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete quiz
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ quizId: string }> }
) {
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

    const { quizId } = await params;
    await connectDB();

    const quiz = await QuizModel.findById(quizId);
    if (!quiz) {
      return NextResponse.json(
        { success: false, error: 'Quiz not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor') {
      const course = await CourseModel.findById(quiz.courseId);
      if (!course || course.instructorId.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to delete this quiz' },
          { status: 403 }
        );
      }
    }

    await QuizModel.findByIdAndDelete(quizId);

    return NextResponse.json({
      success: true,
      message: 'Quiz deleted successfully',
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
