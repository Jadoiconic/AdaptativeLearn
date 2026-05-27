import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { RecommendationModel, ProgressModel, ModuleModel, UserModel } from '@/database/models';

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
    const userId = searchParams.get('userId') || session.user.id;
    const type = searchParams.get('type') || 'all'; // 'all', 'failed', 'ai'
    
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to access other users recommendations' },
        { status: 403 }
      );
    }
    
    let recommendations: any[] = [];
    
    if (type === 'all' || type === 'failed') {
      // Get failed assessments (modules with score < 60)
      const failedProgress = await ProgressModel.find({
        userId,
        score: { $lt: 60, $exists: true },
        status: 'completed'
      })
        .populate('moduleId', 'title difficulty type courseId order')
        .populate('courseId', 'title category');
      
      const failedRecommendations = failedProgress.map((p: any) => ({
        type: 'failed-assessment',
        module: p.moduleId,
        course: p.courseId,
        score: p.score,
        reasoning: `You scored ${p.score}% on this module. Review and retry to improve your understanding.`,
        priority: 'high',
        createdAt: p.completedAt,
      }));
      
      recommendations = [...recommendations, ...failedRecommendations];
    }
    
    if (type === 'all' || type === 'ai') {
      // Get AI recommendations from database
      const aiRecommendations = await RecommendationModel.find({ 
        userId,
        expiresAt: { $gt: new Date() }
      })
        .populate('suggestedModules', 'title difficulty type courseId order')
        .sort({ priority: -1, createdAt: -1 });
      
      const aiRecs = aiRecommendations.map((r: any) => ({
        type: 'ai-recommendation',
        modules: r.suggestedModules,
        reasoning: r.reasoning,
        priority: r.priority,
        createdAt: r.createdAt,
      }));
      
      recommendations = [...recommendations, ...aiRecs];
    }
    
    // Sort by priority (high first) and date
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    recommendations.sort((a: any, b: any) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    return NextResponse.json({ 
      success: true,
      recommendations 
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { userId, suggestedModules, reasoning, priority = 'medium' } = await request.json();
    
    if (!userId || !suggestedModules || !reasoning) {
      return NextResponse.json(
        { error: 'User ID, suggested modules, and reasoning are required' },
        { status: 400 }
      );
    }
    
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to create recommendations for other users' },
        { status: 403 }
      );
    }
    
    const recommendation = new RecommendationModel({
      userId,
      suggestedModules,
      reasoning,
      priority,
    });
    
    await recommendation.save();
    
    const populatedRecommendation = await RecommendationModel.findById(
      recommendation._id
    ).populate('suggestedModules', 'title difficulty type courseId order');
    
    return NextResponse.json({
      message: 'Recommendation created successfully',
      recommendation: populatedRecommendation,
    }, { status: 201 });
  } catch (error) {
    console.error('Create recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { id, suggestedModules, reasoning, priority } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Recommendation ID is required' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    if (suggestedModules) updateData.suggestedModules = suggestedModules;
    if (reasoning) updateData.reasoning = reasoning;
    if (priority) updateData.priority = priority;
    
    const recommendation = await RecommendationModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('suggestedModules', 'title difficulty type courseId order');
    
    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Recommendation updated successfully',
      recommendation,
    });
  } catch (error) {
    console.error('Update recommendation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
