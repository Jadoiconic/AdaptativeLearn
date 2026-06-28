import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import mongoose from 'mongoose';
import { QuizModel, ModuleModel, CourseModel } from '@/database/models';
import { aiService } from '@/lib/ai-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { moduleId, forceRegenerate = false } = body;

    if (!moduleId) {
      return NextResponse.json(
        { success: false, error: 'Module ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get module details
    const module = await ModuleModel.findById(moduleId).populate('courseId');
    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Module not found' },
        { status: 404 }
      );
    }

    // Check if user has permission (instructor or admin)
    if (session.user.role === 'instructor') {
      const course = await CourseModel.findById(module.courseId);
      if (!course || course.instructorId.toString() !== session.user.id) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to generate quizzes for this module' },
          { status: 403 }
        );
      }
    }

    // Check if quiz already exists
    const existingQuiz = await QuizModel.findOne({ moduleId });
    
    if (existingQuiz && !forceRegenerate) {
      if (existingQuiz.status === 'generating') {
        return NextResponse.json(
          { success: false, error: 'Quiz is already being generated', status: 'generating' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Quiz already exists for this module', quiz: existingQuiz },
        { status: 409 }
      );
    }

    // If force regenerate, update existing quiz or create new one
    if (existingQuiz && forceRegenerate) {
      existingQuiz.status = 'generating';
      existingQuiz.metadata.regeneratedAt = new Date();
      existingQuiz.metadata.regeneratedBy = session.user.id as any;
      await existingQuiz.save();
    } else {
      // Create new quiz with generating status
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
    }

    // Trigger AI generation in background
    generateQuizInBackground(moduleId, module, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Quiz generation started',
      status: 'generating',
    });

  } catch (error) {
    console.error('Error starting quiz generation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start quiz generation' },
      { status: 500 }
    );
  }
}

async function generateQuizInBackground(moduleId: string, module: any, userId: string) {
  try {
    await connectDB();

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
      quiz.status = 'draft'; // Set to draft for instructor review
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
        quiz.status = 'draft'; // Still save as draft even if generation failed
        await quiz.save();
      }
    } catch (updateError) {
      console.error('Error updating quiz status after failure:', updateError);
    }
  }
}
