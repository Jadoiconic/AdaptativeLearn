import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CourseModel } from '@/database/models';

// ======================
// GET COURSES
// ======================
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
    const courseId = searchParams.get('courseId');

    const skip = (page - 1) * limit;

    // Build filters
    const filter: any = {};

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (instructorId) {
      filter.instructorId = instructorId;
    }

    if (published !== null) {
      filter.isPublished = published === 'true';
    }

    if (courseId) {
      filter._id = courseId;
    }

    // Fetch courses
    const courses = await CourseModel.find(filter)
      .populate('instructorId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Count total
    const total = await CourseModel.countDocuments(filter);

    return NextResponse.json({
      success: true,
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
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ======================
// CREATE COURSE
// ======================
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (
      !session ||
      (session.user.role !== 'admin' &&
        session.user.role !== 'instructor')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Instructor or Admin access required.',
        },
        { status: 403 }
      );
    }

    await connectDB();

    // Parse request body
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      price,
      thumbnail,
      objectives,
      requirements,
      isPublished = false,
      instructorId: bodyInstructorId,
    } = await request.json();

    // Validation
    if (!title || !description || !category || !duration) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Title, description, category, and duration are required',
        },
        { status: 400 }
      );
    }

    // Admin can assign instructor
    // Instructor uses own ID
    const instructorId =
      session.user.role === 'admin' && bodyInstructorId
        ? bodyInstructorId
        : session.user.id;

    // Create course
    const course = new CourseModel({
      title,
      description,
      category,
      instructorId,
      difficulty,
      duration,
      price,
      thumbnail,
      objectives,
      requirements,
      isPublished,
    });

    await course.save();

    // Populate instructor data
    const populatedCourse = await CourseModel.findById(course._id).populate(
      'instructorId',
      'name email avatar'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'Course created successfully',
        course: populatedCourse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}