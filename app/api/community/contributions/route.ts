import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CommunityContributionModel } from '@/database/models';

// GET — list approved community contributions (+ pending ones for admins/instructors)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const type = searchParams.get('type');
    const showAll = searchParams.get('all') === 'true' && ['admin', 'instructor'].includes(session.user.role);

    await connectDB();

    const filter: Record<string, any> = showAll ? {} : { status: 'approved' };
    if (track) filter.track = track;
    if (type) filter.contributionType = type;

    const contributions = await CommunityContributionModel.find(filter)
      .sort({ votes: -1, createdAt: -1 })
      .populate('userId', 'name avatar role')
      .populate('reviewedBy', 'name')
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, contributions });
  } catch (error) {
    console.error('GET /api/community/contributions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST — submit a new community contribution
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contributionType, title, content, url, skillTags, track } = body;

    if (!contributionType || !title || !content) {
      return NextResponse.json(
        { success: false, error: 'contributionType, title, and content are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Instructors and admins get auto-approved
    const autoApprove = ['instructor', 'admin'].includes(session.user.role);

    const contribution = await CommunityContributionModel.create({
      userId: session.user.id,
      contributionType,
      title,
      content,
      url,
      skillTags: skillTags || [],
      track,
      status: autoApprove ? 'approved' : 'pending',
      reviewedBy: autoApprove ? session.user.id : undefined,
    });

    return NextResponse.json({ success: true, contribution }, { status: 201 });
  } catch (error) {
    console.error('POST /api/community/contributions error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
