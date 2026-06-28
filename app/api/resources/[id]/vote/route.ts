import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ResourceModel } from '@/database/models';
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
      return NextResponse.json({ success: false, error: 'Invalid resource ID' }, { status: 400 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const resource = await ResourceModel.findById(id);

    if (!resource) {
      return NextResponse.json({ success: false, error: 'Resource not found' }, { status: 404 });
    }

    const alreadyVoted = resource.voterIds.some((v: mongoose.Types.ObjectId) => v.equals(userId));

    if (alreadyVoted) {
      // Toggle off
      resource.voterIds = resource.voterIds.filter((v: mongoose.Types.ObjectId) => !v.equals(userId));
      resource.votes = Math.max(0, resource.votes - 1);
    } else {
      resource.voterIds.push(userId);
      resource.votes += 1;
    }

    await resource.save();

    return NextResponse.json({ success: true, votes: resource.votes, voted: !alreadyVoted });
  } catch (error) {
    console.error('POST /api/resources/[id]/vote error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
