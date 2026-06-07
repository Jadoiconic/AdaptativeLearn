import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { AssessmentModel, ModuleModel, CourseModel } from '@/database/models';

// ======================
// GET ASSESSMENTS
// ======================
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    const courseId = searchParams.get('courseId');

    // Build filters
    const filter: any = {};

    if (moduleId) {
      filter.moduleId = moduleId;
    }

    if (courseId) {
      filter.courseId = courseId;
    }

    const assessments = await AssessmentModel.find(filter)
      .populate('moduleId', 'title order')
      .populate('courseId', 'title')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      assessments,
    });
  } catch (error) {
    console.error('Get assessments error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ======================
// CREATE ASSESSMENT
// ======================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'instructor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only instructors and admins can create assessments' },
        { status: 403 }
      );
    }

    await connectDB();

    const { moduleId, courseId, title, description, questions, passingScore, timeLimit, isPublished } = await request.json();

    if (!moduleId || !courseId || !title || !questions || questions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Module ID, course ID, title, and questions are required' },
        { status: 400 }
      );
    }

    // Verify module exists and belongs to instructor
    const module = await ModuleModel.findById(moduleId);
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Verify course ownership
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to create assessment for this course' },
        { status: 403 }
      );
    }

    // Create assessment
    const assessment = new AssessmentModel({
      moduleId,
      courseId,
      title,
      description,
      questions,
      passingScore: passingScore || 60,
      timeLimit,
      isPublished: isPublished || false,
    });

    await assessment.save();

    // Update module with assessment reference
    await ModuleModel.findByIdAndUpdate(moduleId, {
      assessmentId: assessment._id,
    });

    const populatedAssessment = await AssessmentModel.findById(assessment._id)
      .populate('moduleId', 'title order')
      .populate('courseId', 'title');

    return NextResponse.json({
      success: true,
      message: 'Assessment created successfully',
      assessment: populatedAssessment,
    }, { status: 201 });
  } catch (error) {
    console.error('Create assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
