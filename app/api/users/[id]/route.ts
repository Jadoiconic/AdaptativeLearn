import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, ProgressModel } from '@/database/models';
import { computeProfileCompletion } from '@/lib/profile-completion';

const PROFILE_FIELDS =
  'name email role approvalStatus isActive avatar phone bio skills interests education careerGoals placementAssessment createdAt';

// GET - View a learner's profile and progress summary (admin/instructor only)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'instructor')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or instructor access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await connectDB();

    const user = await UserModel.findById(id).select(PROFILE_FIELDS);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const progress = await ProgressModel.find({ userId: id });
    const completedProgress = progress.filter((p) => p.status === 'completed');
    const averageScore = completedProgress.length
      ? Math.round(
          completedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgress.length
        )
      : 0;
    const totalTimeSpentMinutes = progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0);

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        avatar: user.avatar,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        interests: user.interests,
        education: user.education,
        careerGoals: user.careerGoals,
        placementAssessment: user.placementAssessment,
        createdAt: user.createdAt,
      },
      profileCompletion: computeProfileCompletion(user),
      progressSummary: {
        modulesStarted: progress.length,
        modulesCompleted: completedProgress.length,
        averageScore,
        totalTimeSpentMinutes,
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
