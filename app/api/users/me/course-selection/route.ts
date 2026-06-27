import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, CourseModel } from '@/database/models';
import { RecommendedTrack, COURSE_OPTIONS, TRACK_TO_CATEGORY } from '@/lib/placement-tracks';

// POST /api/users/me/course-selection
// Saves the student's chosen course track. Can be called multiple times until
// the placement assessment is completed (students may change their mind).
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { track } = body as { track: RecommendedTrack };

    const validTracks: RecommendedTrack[] = COURSE_OPTIONS.map((c) => c.track);
    if (!validTracks.includes(track)) {
      return NextResponse.json({ error: 'Invalid course track' }, { status: 400 });
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Once the placement assessment is done, the course cannot be changed.
    if (user.placementAssessment?.completed) {
      return NextResponse.json(
        { error: 'Course cannot be changed after completing the placement assessment' },
        { status: 409 }
      );
    }

    const courseOption = COURSE_OPTIONS.find((c) => c.track === track)!;
    const category = TRACK_TO_CATEGORY[track];

    // Try to link to an existing published course for this track (optional).
    const matchingCourse = await CourseModel.findOne({ category, isPublished: true })
      .sort({ difficulty: 1, createdAt: -1 })
      .select('_id');

    user.selectedCourse = courseOption.title;
    user.selectedTrack = track;
    user.selectedCourseId = matchingCourse?._id ?? undefined;
    user.courseSelectionCompleted = true;
    user.courseSelectedAt = new Date();

    await user.save();

    return NextResponse.json({
      success: true,
      selectedCourse: user.selectedCourse,
      selectedTrack: user.selectedTrack,
    });
  } catch (error) {
    console.error('Course selection error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
