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

// ======================
// UPDATE COURSE
// ======================
export async function PUT(request: NextRequest) {
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
        { success: false, error: 'Only instructors and admins can update courses' },
        { status: 403 }
      );
    }

    await connectDB();

    const { courseId, title, description, category, difficulty, duration, price, thumbnail, objectives, requirements, isPublished } = await request.json();

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to update this course' },
        { status: 403 }
      );
    }

    // Update course
    const updatedCourse = await CourseModel.findByIdAndUpdate(
      courseId,
      {
        title: title || course.title,
        description: description || course.description,
        category: category || course.category,
        difficulty: difficulty || course.difficulty,
        duration: duration || course.duration,
        price: price !== undefined ? price : course.price,
        thumbnail: thumbnail || course.thumbnail,
        objectives: objectives || course.objectives,
        requirements: requirements || course.requirements,
        isPublished: isPublished !== undefined ? isPublished : course.isPublished,
      },
      { new: true }
    ).populate('instructorId', 'name email avatar');

    return NextResponse.json({
      success: true,
      message: 'Course updated successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Update course error:', error);

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
// DELETE COURSE
// ======================
export async function DELETE(request: NextRequest) {
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
        { success: false, error: 'Only instructors and admins can delete courses' },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    const course = await CourseModel.findById(courseId);

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this course' },
        { status: 403 }
      );
    }

    // Delete associated modules
    await ModuleModel.deleteMany({ courseId });

    // Delete course
    await CourseModel.findByIdAndDelete(courseId);

    return NextResponse.json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}