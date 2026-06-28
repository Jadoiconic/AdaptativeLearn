import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CommunityContributionModel } from '@/database/models';
import mongoose from 'mongoose';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const contribution = await CommunityContributionModel.findById(id);

    if (!contribution) {
      return NextResponse.json({ success: false, error: 'Contribution not found' }, { status: 404 });
    }

    const alreadyVoted = contribution.voterIds.some((v: mongoose.Types.ObjectId) => v.equals(userId));

    if (alreadyVoted) {
      contribution.voterIds = contribution.voterIds.filter((v: mongoose.Types.ObjectId) => !v.equals(userId));
      contribution.votes = Math.max(0, contribution.votes - 1);
    } else {
      contribution.voterIds.push(userId);
      contribution.votes += 1;
    }

    await contribution.save();

    return NextResponse.json({ success: true, votes: contribution.votes, voted: !alreadyVoted });
  } catch (error) {
    console.error('POST /api/community/contributions/[id]/vote error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
