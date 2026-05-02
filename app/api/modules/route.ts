import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ModuleModel, CourseModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (courseId) filter.courseId = courseId;
    
    const modules = await ModuleModel.find(filter)
      .populate('courseId', 'title category')
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ModuleModel.countDocuments(filter);
    
    return NextResponse.json({
      modules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get modules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        { error: 'Unauthorized. Instructor or Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();
    
    const {
      courseId,
      title,
      description,
      content,
      order,
      difficulty,
      type,
      videoUrl,
      fileUrl,
      isPublished = false,
    } = await request.json();
    
    if (!courseId || !title || !description || !content) {
      return NextResponse.json(
        { error: 'Course ID, title, description, and content are required' },
        { status: 400 }
      );
    }
    
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only create modules for your own courses' },
        { status: 403 }
      );
    }
    
    const module = new ModuleModel({
      courseId,
      title,
      description,
      content,
      order,
      difficulty,
      type,
      videoUrl,
      fileUrl,
      isPublished,
    });
    
    await module.save();
    
    const populatedModule = await ModuleModel.findById(module._id).populate(
      'courseId',
      'title category'
    );
    
    return NextResponse.json({
      message: 'Module created successfully',
      module: populatedModule,
    }, { status: 201 });
  } catch (error) {
    console.error('Create module error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
