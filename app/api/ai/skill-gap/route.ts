import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, SkillGapAnalysisModel } from '@/database/models';
import { aiService } from '@/lib/ai-service';
import { TRACK_REQUIRED_SKILLS, TRACK_LABELS, TRACK_ASSESSMENT_DOMAIN, RecommendedTrack } from '@/lib/placement-tracks';

// GET — return the most recent skill gap analysis for the current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const analysis = await SkillGapAnalysisModel.findOne({ userId: session.user.id }).sort({ generatedAt: -1 });

    return NextResponse.json({ success: true, analysis: analysis || null });
  } catch (error) {
    console.error('GET /api/ai/skill-gap error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// POST — generate a new skill gap analysis for the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentSkills } = body as { currentSkills: string[] };

    if (!Array.isArray(currentSkills)) {
      return NextResponse.json({ success: false, error: 'currentSkills must be an array' }, { status: 400 });
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id).select(
      'selectedTrack skills careerGoals placementAssessment'
    );

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (!user.placementAssessment?.completed) {
      return NextResponse.json(
        { success: false, error: 'Please complete the placement assessment before running skill gap analysis.' },
        { status: 400 }
      );
    }

    const track = (user.selectedTrack ?? 'software-development') as RecommendedTrack;
    const requiredSkills = TRACK_REQUIRED_SKILLS[track] ?? TRACK_REQUIRED_SKILLS['software-development'];
    const trackLabel = TRACK_LABELS[track] ?? track;
    const trackDescription = TRACK_ASSESSMENT_DOMAIN[track] ?? '';

    const result = await aiService.generateSkillGapAnalysis({
      track: trackLabel,
      trackDescription,
      requiredSkills,
      currentSkills,
      careerGoal: user.careerGoals,
      assessmentScore: user.placementAssessment.score,
    });

    const analysis = await SkillGapAnalysisModel.create({
      userId: user._id,
      track,
      inputSkills: currentSkills,
      skillGaps: result.skillGaps,
      masteredSkills: result.masteredSkills,
      roadmap: result.roadmap,
      readinessScores: result.readinessScores,
      estimatedDuration: result.estimatedDuration,
      nextSteps: result.nextSteps,
      aiNotes: result.aiNotes,
      generatedAt: new Date(),
    });

    // Persist the updated skill list to the user profile
    if (currentSkills.length > 0) {
      await UserModel.findByIdAndUpdate(user._id, { skills: currentSkills });
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error('POST /api/ai/skill-gap error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
