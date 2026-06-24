import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { QuizResultModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const moduleId = searchParams.get('moduleId');
    const courseId = searchParams.get('courseId');
    const studentId = searchParams.get('studentId');
    
    const filter: any = {};
    
    // Filter by quiz, module, course, or student
    if (quizId) filter.quizId = quizId;
    if (moduleId) filter.moduleId = moduleId;
    if (courseId) filter.courseId = courseId;
    
    // Students can only see their own results
    if (session.user.role === 'student') {
      filter.studentId = session.user.id;
    } else if (studentId) {
      filter.studentId = studentId;
    }
    
    const results = await QuizResultModel.find(filter)
      .populate('quizId', 'title')
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .populate('studentId', 'name email')
      .sort({ completedAt: -1 });
    
    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
