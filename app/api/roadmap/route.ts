import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { RoadmapModel, UserModel } from '@/database/models';
import { generateRoadmapForUser } from '@/lib/roadmap';

// GET - the current user's active personalized roadmap (null until placement assessment is completed)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    let roadmap = await RoadmapModel.findOne({ userId: session.user.id, isActive: true }).sort({
      createdAt: -1,
    });

    // Backfill for accounts that completed placement before roadmap generation existed.
    if (!roadmap) {
      const user = await UserModel.findById(session.user.id).select('placementAssessment generatedRoadmapId');
      if (user?.placementAssessment?.completed && user.placementAssessment.recommendedLevel && !user.generatedRoadmapId) {
        const { courseIds, roadmapId } = await generateRoadmapForUser(
          session.user.id,
          user.placementAssessment.recommendedLevel,
          user.placementAssessment.recommendedTrack as any
        );
        user.readinessScore = user.placementAssessment.score != null ? Math.round(user.placementAssessment.score) : undefined;
        user.recommendedCourses = courseIds;
        user.generatedRoadmapId = roadmapId;
        await user.save();
        roadmap = await RoadmapModel.findById(roadmapId);
      }
    }

    await roadmap?.populate('steps.courseId', 'title description category difficulty thumbnail duration');

    return NextResponse.json({ success: true, roadmap: roadmap || null });
  } catch (error) {
    console.error('Get roadmap error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
