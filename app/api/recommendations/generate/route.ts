import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AdaptiveLearningEngine } from '@/lib/adaptive-learning';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = await request.json();
    const targetUserId = userId || session.user.id;

    // Only allow users to generate recommendations for themselves,
    // or admins to generate for any user
    if (session.user.role !== 'admin' && targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to generate recommendations for other users' },
        { status: 403 }
      );
    }

    // Generate recommendations using the adaptive learning engine
    const recommendations = await AdaptiveLearningEngine.generateRecommendations(targetUserId);
    
    // Save recommendations to database
    await AdaptiveLearningEngine.saveRecommendations(targetUserId, recommendations);

    return NextResponse.json({
      message: 'Recommendations generated successfully',
      recommendations,
    });
  } catch (error) {
    console.error('Generate recommendations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
