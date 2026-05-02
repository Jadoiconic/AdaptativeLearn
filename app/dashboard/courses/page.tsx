'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CoursesPage() {
  const { data: session } = useSession();

  const courses = [
    {
      id: 1,
      title: 'Introduction to Web Development',
      instructor: 'John Doe',
      progress: 75,
      thumbnail: '/api/placeholder/300/200',
      description: 'Learn the fundamentals of HTML, CSS, and JavaScript',
      duration: '8 weeks',
      level: 'Beginner'
    },
    {
      id: 2,
      title: 'Advanced React Development',
      instructor: 'Jane Smith',
      progress: 30,
      thumbnail: '/api/placeholder/300/200',
      description: 'Master React hooks, context, and advanced patterns',
      duration: '12 weeks',
      level: 'Advanced'
    },
    {
      id: 3,
      title: 'Database Design Fundamentals',
      instructor: 'Mike Johnson',
      progress: 0,
      thumbnail: '/api/placeholder/300/200',
      description: 'Understanding relational databases and SQL',
      duration: '6 weeks',
      level: 'Intermediate'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Courses</h1>
        <p className="text-slate-600">Continue your learning journey and track your progress</p>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-slate-200/60">
            {/* Course Thumbnail */}
            <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="absolute top-3 right-3">
                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700">
                  {course.level}
                </span>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-sm text-slate-600 mb-3">{course.description}</p>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>By {course.instructor}</span>
                  <span>{course.duration}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-700">Progress</span>
                  <span className="text-sm font-medium text-slate-700">{course.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                {course.progress > 0 ? 'Continue Learning' : 'Start Course'}
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State for when no courses */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No courses yet</h3>
          <p className="text-slate-600 mb-6">Start your learning journey by enrolling in your first course</p>
          <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
            Browse Courses
          </button>
        </div>
      )}
    </div>
  );
}
