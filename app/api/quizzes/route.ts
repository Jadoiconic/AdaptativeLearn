import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { QuizModel } from '@/database/models';

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
    const moduleId = searchParams.get('moduleId');
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');
    
    const filter: any = {};
    
    // Filter by module or course
    if (moduleId) filter.moduleId = moduleId;
    if (courseId) filter.courseId = courseId;
    
    // Filter by status (optional)
    if (status) filter.status = status;
    
    // For students, only show published quizzes
    if (session.user.role === 'student') {
      filter.status = 'published';
    }
    
    const quizzes = await QuizModel.find(filter)
      .populate('moduleId', 'title')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      quizzes,
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
