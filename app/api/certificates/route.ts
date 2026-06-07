import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { CertificateModel, CourseModel, ProgressModel, UserModel } from '@/database/models';

// Generate unique certificate number
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

// POST - Generate certificate for completed course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { courseId } = body;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Check if certificate already exists
    const existingCertificate = await CertificateModel.findOne({
      userId: session.user.id,
      courseId: courseId,
    });
    
    if (existingCertificate) {
      return NextResponse.json({
        success: true,
        certificate: existingCertificate,
        message: 'Certificate already exists',
      });
    }
    
    // Get course details
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Check if user has completed the course
    const progressRecords = await ProgressModel.find({
      userId: session.user.id,
      courseId: courseId,
    });
    
    const totalModules = progressRecords.length;
    const completedModules = progressRecords.filter(p => p.status === 'completed').length;
    
    if (completedModules < totalModules) {
      return NextResponse.json(
        { error: 'Course not completed yet' },
        { status: 400 }
      );
    }
    
    // Calculate average score
    const scores = progressRecords
      .filter(p => p.score !== undefined && p.score !== null)
      .map(p => p.score);
    const averageScore = scores.length > 0 
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length 
      : undefined;
    
    // Get completion date
    const completionDate = progressRecords
      .filter(p => p.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())[0]?.completedAt || new Date();
    
    // Generate certificate
    const certificate = await CertificateModel.create({
      userId: session.user.id,
      courseId: courseId,
      certificateNumber: generateCertificateNumber(),
      issueDate: new Date(),
      completionDate: completionDate,
      score: averageScore,
      isValid: true,
    });
    
    console.log('Certificate created with ID:', certificate._id);
    
    // Populate certificate with user and course details
    const populatedCertificate = await CertificateModel.findById(certificate._id)
      .populate('userId', 'name email')
      .populate('courseId', 'title description category difficulty');
    
    if (!populatedCertificate) {
      console.error('Failed to populate certificate');
      return NextResponse.json(
        { error: 'Failed to populate certificate' },
        { status: 500 }
      );
    }
    
    console.log('Certificate populated successfully:', populatedCertificate._id);
    
    return NextResponse.json({
      success: true,
      certificate: populatedCertificate,
      message: 'Certificate generated successfully',
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get user's certificates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const certificates = await CertificateModel.find({ userId: session.user.id })
      .populate('userId', 'name email')
      .populate('courseId', 'title description category difficulty')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      certificates,
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
