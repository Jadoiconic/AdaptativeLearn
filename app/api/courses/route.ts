import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CourseModel, UserModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const instructorId = searchParams.get('instructorId');
    const published = searchParams.get('published');
    
    const skip = (page - 1) * limit;
    
    const filter: any = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (instructorId) filter.instructorId = instructorId;
    if (published !== null) filter.isPublished = published === 'true';
    
    const courses = await CourseModel.find(filter)
      .populate('instructorId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await CourseModel.countDocuments(filter);
    
    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get courses error:', error);
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
      title,
      description,
      category,
      difficulty,
      duration,
      thumbnail,
      isPublished = false,
    } = await request.json();
    
    if (!title || !description || !category || !duration) {
      return NextResponse.json(
        { error: 'Title, description, category, and duration are required' },
        { status: 400 }
      );
    }
    
    const instructorId = session.user.id;
    
    if (session.user.role === 'admin' && request.body.instructorId) {
      instructorId = request.body.instructorId;
    }
    
    const course = new CourseModel({
      title,
      description,
      category,
      instructorId,
      difficulty,
      duration,
      thumbnail,
      isPublished,
    });
    
    await course.save();
    
    const populatedCourse = await CourseModel.findById(course._id).populate(
      'instructorId',
      'name email avatar'
    );
    
    return NextResponse.json({
      message: 'Course created successfully',
      course: populatedCourse,
    }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
