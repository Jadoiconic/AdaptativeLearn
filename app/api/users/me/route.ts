import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel } from '@/database/models';
import { computeProfileCompletion } from '@/lib/profile-completion';

const PROFILE_FIELDS =
  'name email role approvalStatus isActive avatar phone bio skills interests education careerGoals placementAssessment createdAt';

const MAX_LIST_ITEMS = 30;
const MAX_LIST_ITEM_LENGTH = 60;
const MAX_TEXT_LENGTH = 1000;

function isCloudinaryUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'res.cloudinary.com';
  } catch {
    return false;
  }
}

function sanitizeStringList(value: unknown, fieldName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array of strings`);
  }
  const cleaned = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= MAX_LIST_ITEM_LENGTH);

  if (cleaned.length > MAX_LIST_ITEMS) {
    throw new Error(`${fieldName} cannot have more than ${MAX_LIST_ITEMS} items`);
  }
  return Array.from(new Set(cleaned));
}

function sanitizeEducation(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('education must be an array');
  }
  if (value.length > MAX_LIST_ITEMS) {
    throw new Error(`education cannot have more than ${MAX_LIST_ITEMS} entries`);
  }

  return value.map((entry) => {
    if (!entry || typeof entry !== 'object' || typeof (entry as any).institution !== 'string' || !(entry as any).institution.trim()) {
      throw new Error('Each education entry requires an institution name');
    }
    const e = entry as Record<string, unknown>;
    return {
      institution: String(e.institution).trim().slice(0, MAX_LIST_ITEM_LENGTH),
      degree: typeof e.degree === 'string' ? e.degree.trim().slice(0, MAX_LIST_ITEM_LENGTH) : undefined,
      fieldOfStudy: typeof e.fieldOfStudy === 'string' ? e.fieldOfStudy.trim().slice(0, MAX_LIST_ITEM_LENGTH) : undefined,
      startYear: typeof e.startYear === 'number' ? e.startYear : undefined,
      endYear: typeof e.endYear === 'number' ? e.endYear : undefined,
    };
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await UserModel.findById(session.user.id).select(PROFILE_FIELDS);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || !body.name.trim()) {
        return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
      }
      updateData.name = body.name.trim().slice(0, 100);
    }

    if (body.phone !== undefined) {
      if (typeof body.phone !== 'string') {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      }
      updateData.phone = body.phone.trim().slice(0, 30);
    }

    if (body.bio !== undefined) {
      if (typeof body.bio !== 'string' || body.bio.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: `Bio must be under ${MAX_TEXT_LENGTH} characters` }, { status: 400 });
      }
      updateData.bio = body.bio.trim();
    }

    if (body.careerGoals !== undefined) {
      if (typeof body.careerGoals !== 'string' || body.careerGoals.length > MAX_TEXT_LENGTH) {
        return NextResponse.json({ error: `Career goals must be under ${MAX_TEXT_LENGTH} characters` }, { status: 400 });
      }
      updateData.careerGoals = body.careerGoals.trim();
    }

    if (body.avatar !== undefined) {
      if (typeof body.avatar !== 'string' || (body.avatar && !isCloudinaryUrl(body.avatar))) {
        return NextResponse.json({ error: 'Invalid profile image URL' }, { status: 400 });
      }
      updateData.avatar = body.avatar;
    }

    try {
      if (body.skills !== undefined) {
        updateData.skills = sanitizeStringList(body.skills, 'skills');
      }
      if (body.interests !== undefined) {
        updateData.interests = sanitizeStringList(body.interests, 'interests');
      }
      if (body.education !== undefined) {
        updateData.education = sanitizeEducation(body.education);
      }
    } catch (validationError) {
      return NextResponse.json({ error: (validationError as Error).message }, { status: 400 });
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findByIdAndUpdate(session.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select(PROFILE_FIELDS);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
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
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
