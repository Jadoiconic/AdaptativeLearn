import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, CourseModel, ModuleModel, ProgressModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Get total users
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ isActive: true });
    
    // Get total courses
    const totalCourses = await CourseModel.countDocuments();
    
    // Get total modules
    const totalModules = await ModuleModel.countDocuments();
    
    // Get completion rate (users who have completed at least one module)
    const usersWithProgress = await ProgressModel.distinct('userId');
    const completionRate = totalUsers > 0 
      ? (usersWithProgress.length / totalUsers) * 100 
      : 0;
    
    // Calculate average score from all completed modules
    const allProgress = await ProgressModel.find({ completed: true });
    const averageScore = allProgress.length > 0
      ? allProgress.reduce((sum, p) => sum + (p.score || 0), 0) / allProgress.length
      : 0;
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalCourses,
      totalModules,
      completionRate: Math.round(completionRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
