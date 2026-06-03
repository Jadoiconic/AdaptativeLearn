import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { ActivityModel, CourseModel, UserModel } from '@/database/models';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'instructor') {
      return NextResponse.json(
        { error: 'Unauthorized. Instructor access required.' },
        { status: 403 }
      );
    }

    await connectDB();
    
    // Get courses taught by this instructor
    const instructorCourses = await CourseModel.find({ instructorId: session.user.id }).select('_id');
    const courseIds = instructorCourses.map(course => course._id);
    
    // Fetch recent activities for these courses
    const activities = await ActivityModel.find({ courseId: { $in: courseIds } })
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .populate('moduleId', 'title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Format activities for frontend
    const formattedActivities = activities.map(activity => {
      const user = activity.userId as any;
      const course = activity.courseId as any;
      const module = activity.moduleId as any;
      
      let activityText = '';
      let detailsText = '';
      
      switch (activity.activityType) {
        case 'enrolled':
          activityText = `${user?.name || 'User'} enrolled in course`;
          detailsText = course?.title || 'Unknown Course';
          break;
        case 'completed_module':
          activityText = `${user?.name || 'User'} completed module`;
          detailsText = `${module?.title || 'Unknown Module'} - ${course?.title || 'Unknown Course'}`;
          break;
        case 'submitted_quiz':
          activityText = `${user?.name || 'User'} submitted quiz`;
          detailsText = `Score: ${activity.score}% - ${module?.title || 'Unknown Module'}`;
          break;
        case 'started_course':
          activityText = `${user?.name || 'User'} started course`;
          detailsText = course?.title || 'Unknown Course';
          break;
        default:
          activityText = `${user?.name || 'User'} performed action`;
          detailsText = course?.title || 'Unknown Course';
      }
      
      // Calculate time ago
      const timeAgo = getTimeAgo(activity.createdAt);
      
      // Get color based on activity type
      const colorMap: Record<string, string> = {
        enrolled: 'blue',
        completed_module: 'green',
        submitted_quiz: 'yellow',
        started_course: 'purple',
      };
      const color = colorMap[activity.activityType] || 'gray';
      
      return {
        id: activity._id,
        activityText,
        detailsText,
        timeAgo,
        color,
        createdAt: activity.createdAt,
      };
    });
    
    return NextResponse.json({
      activities: formattedActivities,
    });
  } catch (error) {
    console.error('Get instructor activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
}
