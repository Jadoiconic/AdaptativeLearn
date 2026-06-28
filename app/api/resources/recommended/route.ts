import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ResourceModel, SkillGapAnalysisModel, UserModel } from '@/database/models';

// GET — return resources matched to the current user's skill gaps and track
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const [user, latestAnalysis] = await Promise.all([
      UserModel.findById(session.user.id).select('selectedTrack skills'),
      SkillGapAnalysisModel.findOne({ userId: session.user.id }).sort({ generatedAt: -1 }),
    ]);

    const track = user?.selectedTrack;
    const gapSkills = latestAnalysis?.skillGaps?.map((g: { skill: string }) => g.skill) ?? [];

    let resources;

    if (gapSkills.length > 0) {
      // Primary: resources that match one or more skill gaps
      resources = await ResourceModel.find({
        isPublished: true,
        $or: [
          { skillTags: { $in: gapSkills } },
          { track },
        ],
      })
        .sort({ verifiedByExpert: -1, votes: -1 })
        .populate('addedBy', 'name role')
        .populate('verifiedBy', 'name')
        .limit(20)
        .lean();

      // Score and sort: prioritise skill-gap matches over track-only matches
      resources = resources
        .map((r: any) => {
          const gapMatchCount = r.skillTags.filter((t: string) => gapSkills.includes(t)).length;
          return { ...r, _matchScore: gapMatchCount * 10 + (r.verifiedByExpert ? 5 : 0) + r.votes };
        })
        .sort((a: any, b: any) => b._matchScore - a._matchScore);
    } else {
      // No gap analysis yet — return top-rated resources for the user's track
      resources = await ResourceModel.find({
        isPublished: true,
        ...(track ? { track } : {}),
      })
        .sort({ verifiedByExpert: -1, votes: -1 })
        .populate('addedBy', 'name role')
        .populate('verifiedBy', 'name')
        .limit(12)
        .lean();
    }

    return NextResponse.json({
      success: true,
      resources,
      meta: {
        basedOnGaps: gapSkills.length > 0,
        gapSkills,
        track,
      },
    });
  } catch (error) {
    console.error('GET /api/resources/recommended error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
