import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ModuleModel, CourseModel, UserModel, QuizModel } from '@/database/models';
import { aiService } from '@/lib/ai-service';

// Background function to trigger quiz generation
async function triggerQuizGeneration(moduleId: string, module: any, userId: string) {
  try {
    // Check if quiz already exists
    await connectDB();
    const existingQuiz = await QuizModel.findOne({ moduleId });
    
    if (existingQuiz) {
      console.log(`Quiz already exists for module ${moduleId}, skipping generation`);
      return;
    }

    // Create quiz with generating status
    const newQuiz = new QuizModel({
      moduleId,
      courseId: module.courseId,
      title: `Assessment for ${module.title}`,
      description: 'Evaluate your knowledge of this module',
      status: 'generating',
      generatedBy: 'ai',
      metadata: {
        moduleTitle: module.title,
        generatedAt: new Date(),
      },
    });
    await newQuiz.save();

    // Prepare module content for AI
    const moduleContent = {
      title: module.title,
      description: module.description || '',
      lessons: module.lessons || [],
      category: module.category || '',
      materials: module.materials || [],
    };

    // Generate quiz using AI service
    const generatedQuiz = await aiService.generateQuiz(moduleContent);

    // Update quiz with generated content
    const quiz = await QuizModel.findOne({ moduleId });
    if (quiz) {
      quiz.title = generatedQuiz.title;
      quiz.description = generatedQuiz.description;
      quiz.questions = generatedQuiz.questions;
      quiz.passingScore = generatedQuiz.passingScore;
      quiz.timeLimit = generatedQuiz.timeLimit;
      quiz.status = 'draft';
      quiz.metadata.provider = generatedQuiz.metadata.provider;
      quiz.metadata.model = generatedQuiz.metadata.model;
      quiz.metadata.generatedAt = new Date(generatedQuiz.metadata.generatedAt);
      
      await quiz.save();
      console.log(`Quiz generated successfully for module ${moduleId}`);
    }
  } catch (error) {
    console.error('Error generating quiz in background:', error);
    
    // Update quiz status to indicate failure
    try {
      const quiz = await QuizModel.findOne({ moduleId });
      if (quiz) {
        quiz.status = 'draft';
        await quiz.save();
      }
    } catch (updateError) {
      console.error('Error updating quiz status after failure:', updateError);
    }
  }
}

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
      success: true,
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
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Instructor or Admin access required.',
        },
        { status: 403 }
      );
    }

    // Check if instructor is approved
    if (session.user.role === 'instructor') {
      await connectDB();
      const instructor = await UserModel.findById(session.user.id);
      if (!instructor || !instructor.isApproved) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your instructor account is not approved yet. Please wait for admin approval.',
          },
          { status: 403 }
        );
      }
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
      objectives,
      estimatedTime,
      skillsCovered,
      aiQuizEnabled,
      internshipOutcome,
      videoUrl,
      fileUrl,
      isPublished = false,
    } = await request.json();

    if (!courseId || !title || !description || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course ID, title, description, and content are required',
        },
        { status: 400 }
      );
    }

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only create modules for your own courses',
        },
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
      objectives: objectives || [],
      estimatedTime: estimatedTime || '',
      skillsCovered: skillsCovered || [],
      aiQuizEnabled: aiQuizEnabled || false,
      internshipOutcome: internshipOutcome || '',
      videoUrl,
      fileUrl,
      isPublished,
      createdBy: session.user.id,
    });
    
    await module.save();
    
    // Trigger automatic quiz generation in background (fire and forget)
    triggerQuizGeneration(module._id.toString(), module, session.user.id).catch(err => {
      console.error('Background quiz generation failed:', err);
    });
    
    // Increment course module count
    await CourseModel.findByIdAndUpdate(courseId, {
      $inc: { moduleCount: 1 }
    });
    
    const populatedModule = await ModuleModel.findById(module._id).populate(
      'courseId',
      'title category'
    );
    
    return NextResponse.json(
      {
        success: true,
        message: 'Module created successfully',
        module: populatedModule,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create module error:', error);
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
// UPDATE MODULE
// ======================
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Instructor or Admin access required.',
        },
        { status: 403 }
      );
    }

    // Check if instructor is approved
    if (session.user.role === 'instructor') {
      await connectDB();
      const instructor = await UserModel.findById(session.user.id);
      if (!instructor || !instructor.isApproved) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your instructor account is not approved yet. Please wait for admin approval.',
          },
          { status: 403 }
        );
      }
    }

    await connectDB();

    const {
      moduleId,
      courseId,
      title,
      description,
      content,
      order,
      difficulty,
      type,
      objectives,
      estimatedTime,
      skillsCovered,
      aiQuizEnabled,
      internshipOutcome,
      videoUrl,
      fileUrl,
      isPublished,
    } = await request.json();

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID is required',
        },
        { status: 400 }
      );
    }

    const module = await ModuleModel.findById(moduleId);

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module not found',
        },
        { status: 404 }
      );
    }

    // Check course ownership
    const course = await CourseModel.findById(module.courseId);
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only update modules for your own courses',
        },
        { status: 403 }
      );
    }

    // Update module
    const updatedModule = await ModuleModel.findByIdAndUpdate(
      moduleId,
      {
        courseId: courseId || module.courseId,
        title: title || module.title,
        description: description || module.description,
        content: content || module.content,
        order: order !== undefined ? order : module.order,
        difficulty: difficulty || module.difficulty,
        type: type || module.type,
        objectives: objectives !== undefined ? objectives : module.objectives,
        estimatedTime: estimatedTime !== undefined ? estimatedTime : module.estimatedTime,
        skillsCovered: skillsCovered !== undefined ? skillsCovered : module.skillsCovered,
        aiQuizEnabled: aiQuizEnabled !== undefined ? aiQuizEnabled : module.aiQuizEnabled,
        internshipOutcome: internshipOutcome !== undefined ? internshipOutcome : module.internshipOutcome,
        videoUrl: videoUrl !== undefined ? videoUrl : module.videoUrl,
        fileUrl: fileUrl !== undefined ? fileUrl : module.fileUrl,
        isPublished: isPublished !== undefined ? isPublished : module.isPublished,
      },
      { new: true }
    ).populate('courseId', 'title category');

    return NextResponse.json(
      {
        success: true,
        message: 'Module updated successfully',
        module: updatedModule,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update module error:', error);
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
// DELETE MODULE
// ======================
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Instructor or Admin access required.',
        },
        { status: 403 }
      );
    }

    // Check if instructor is approved
    if (session.user.role === 'instructor') {
      await connectDB();
      const instructor = await UserModel.findById(session.user.id);
      if (!instructor || !instructor.isApproved) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your instructor account is not approved yet. Please wait for admin approval.',
          },
          { status: 403 }
        );
      }
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    if (!moduleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID is required',
        },
        { status: 400 }
      );
    }

    const module = await ModuleModel.findById(moduleId);

    if (!module) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module not found',
        },
        { status: 404 }
      );
    }

    // Check course ownership
    const course = await CourseModel.findById(module.courseId);
    if (!course) {
      return NextResponse.json(
        {
          success: false,
          error: 'Course not found',
        },
        { status: 404 }
      );
    }

    if (session.user.role === 'instructor' && course.instructorId.toString() !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'You can only delete modules for your own courses',
        },
        { status: 403 }
      );
    }

    // Delete module
    await ModuleModel.findByIdAndDelete(moduleId);

    // Decrement course module count
    await CourseModel.findByIdAndUpdate(module.courseId, {
      $inc: { moduleCount: -1 }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Module deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete module error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
