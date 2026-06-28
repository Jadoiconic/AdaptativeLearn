import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ResourceModel } from '@/database/models';

// GET — list resources with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');
    const type = searchParams.get('type');
    const difficulty = searchParams.get('difficulty');
    const verified = searchParams.get('verified');
    const source = searchParams.get('source');
    const search = searchParams.get('search');

    await connectDB();

    const filter: Record<string, any> = { isPublished: true };
    if (track) filter.track = track;
    if (type) filter.type = type;
    if (difficulty) filter.difficulty = difficulty;
    if (verified === 'true') filter.verifiedByExpert = true;
    if (source) filter.source = source;
    if (search) filter.$text = { $search: search };

    const resources = await ResourceModel.find(filter)
      .sort({ verifiedByExpert: -1, votes: -1, createdAt: -1 })
      .populate('addedBy', 'name role')
      .populate('verifiedBy', 'name')
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, resources });
  } catch (error) {
    console.error('GET /api/resources error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST — add a new curated resource (instructors and admins only)
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
    const { title, description, type, url, duration, skillTags, track, roadmapPhase, difficulty } = body;

    if (!title || !description || !type) {
      return NextResponse.json({ success: false, error: 'title, description, and type are required' }, { status: 400 });
    }

    await connectDB();

    const resource = await ResourceModel.create({
      title,
      description,
      type,
      url,
      duration,
      skillTags: skillTags || [],
      track,
      roadmapPhase,
      difficulty: difficulty || 'beginner',
      verifiedByExpert: session.user.role === 'instructor' || session.user.role === 'admin',
      verifiedBy: session.user.role !== 'student' ? session.user.id : undefined,
      addedBy: session.user.id,
      source: 'curated',
      isPublished: true,
    });

    return NextResponse.json({ success: true, resource }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resources error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
