import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ExpertReviewModel } from '@/database/models';

// GET — reviews for the current user (student) or by instructor (instructor/admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    await connectDB();

    let filter: Record<string, any>;

    if (session.user.role === 'student') {
      filter = { targetUserId: session.user.id };
    } else if (targetUserId) {
      filter = { targetUserId };
    } else {
      filter = { instructorId: session.user.id };
    }

    const reviews = await ExpertReviewModel.find(filter)
      .sort({ createdAt: -1 })
      .populate('instructorId', 'name avatar')
      .populate('targetUserId', 'name email selectedTrack')
      .limit(20)
      .lean();

    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('GET /api/expert-reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST — submit an expert review (instructors and admins only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!['instructor', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      targetUserId,
      roadmapId,
      skillGapAnalysisId,
      overallRating,
      approvalStatus,
      comments,
      suggestedChanges,
      strengths,
      areasToImprove,
    } = body;

    if (!targetUserId || !overallRating || !comments) {
      return NextResponse.json(
        { success: false, error: 'targetUserId, overallRating, and comments are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const review = await ExpertReviewModel.create({
      instructorId: session.user.id,
      targetUserId,
      roadmapId,
      skillGapAnalysisId,
      overallRating,
      approvalStatus: approvalStatus || 'pending',
      comments,
      suggestedChanges: suggestedChanges || [],
      strengths: strengths || [],
      areasToImprove: areasToImprove || [],
      reviewedAt: new Date(),
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error('POST /api/expert-reviews error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
