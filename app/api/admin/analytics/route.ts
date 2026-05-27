import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel, ProgressModel } from '@/database/models';

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
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7'; // 7, 30, or 90 days
    
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get user registrations over time
    const userRegistrations = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Get module completions over time
    const moduleCompletions = await ProgressModel.aggregate([
      {
        $match: {
          completed: true,
          updatedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    // Generate date range labels
    const labels = [];
    const registrationData = [];
    const completionData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const label = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      labels.push(label);
      
      const regData = userRegistrations.find(r => r._id === dateStr);
      registrationData.push(regData ? regData.count : 0);
      
      const compData = moduleCompletions.find(c => c._id === dateStr);
      completionData.push(compData ? compData.count : 0);
    }
    
    return NextResponse.json({
      labels,
      registrations: registrationData,
      completions: completionData,
      totalRegistrations: userRegistrations.reduce((sum, r) => sum + r.count, 0),
      totalCompletions: moduleCompletions.reduce((sum, c) => sum + c.count, 0),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
