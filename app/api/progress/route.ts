import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ProgressModel, ModuleModel, CourseModel, CertificateModel, RecommendationModel } from '@/database/models';

// Generate unique certificate number
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId') || session.user.id;
    
    const filter: any = { userId };
    if (courseId) filter.courseId = courseId;
    
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized to access other users progress',
        },
        { status: 403 }
      );
    }
    
    const progress = await ProgressModel.find(filter)
      .populate('moduleId', 'title type order')
      .populate('courseId', 'title category')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error('Get progress error:', error);
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
    
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { moduleId, status, score, timeSpent } = await request.json();
    
    if (!moduleId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Module ID and status are required',
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
    
    const userId = session.user.id;
    const courseId = module.courseId;
    
    let progress = await ProgressModel.findOne({
      userId,
      moduleId,
      courseId,
    });
    
    if (progress) {
      progress.status = status;
      if (score !== undefined) progress.score = score;
      if (timeSpent !== undefined) progress.timeSpent += timeSpent;
      if (status === 'completed') progress.completedAt = new Date();
      
      await progress.save();
    } else {
      progress = new ProgressModel({
        userId,
        moduleId,
        courseId,
        status,
        score,
        timeSpent: timeSpent || 0,
        completedAt: status === 'completed' ? new Date() : undefined,
      });
      
      await progress.save();
    }
    
    const populatedProgress = await ProgressModel.findById(progress._id)
      .populate('moduleId', 'title type order')
      .populate('courseId', 'title category');
    
    // Check if all modules in the course are completed
    if (status === 'completed') {
      // Remove AI recommendations if student passed the module (score >= 60)
      if (score !== undefined && score >= 60) {
        await RecommendationModel.deleteMany({
          userId,
          suggestedModules: moduleId,
        });
        console.log(`Removed AI recommendations for user ${userId} for module ${moduleId} after passing`);
      }
      
      const allModules = await ModuleModel.find({ courseId });
      const allProgress = await ProgressModel.find({ userId, courseId });
      
      const completedModules = allProgress.filter(p => p.status === 'completed').length;
      
      if (completedModules === allModules.length) {
        // All modules completed, check if certificate already exists
        const existingCertificate = await CertificateModel.findOne({
          userId,
          courseId,
        });
        
        if (!existingCertificate) {
          // Calculate average score
          const scores = allProgress
            .filter(p => p.score !== undefined && p.score !== null)
            .map(p => p.score);
          const averageScore = scores.length > 0 
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
            : undefined;
          
          // Get completion date
          const completionDate = allProgress
            .filter(p => p.completedAt)
            .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]?.completedAt || new Date();
          
          // Generate certificate
          await CertificateModel.create({
            userId,
            courseId,
            certificateNumber: generateCertificateNumber(),
            issueDate: new Date(),
            completionDate: completionDate,
            score: averageScore,
            isValid: true,
          });
          
          console.log(`Certificate automatically generated for user ${userId} for course ${courseId}`);
        }
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        message: 'Progress updated successfully',
        progress: populatedProgress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update progress error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
