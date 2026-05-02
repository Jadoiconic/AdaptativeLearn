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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    
    if (session.user.role !== 'admin' && userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to access other users recommendations' },
        { status: 403 }
      );
    }
    
    const recommendations = await RecommendationModel.find({ 
      userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('suggestedModules', 'title difficulty type courseId order')
      .sort({ priority: -1, createdAt: -1 });
    
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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
