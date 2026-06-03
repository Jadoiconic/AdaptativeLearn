'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CourseProgress {
  _id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  thumbnail?: string;
  moduleCount?: number;
  progress: number;
  completedModules: number;
  totalModules: number;
  lastAccessed: string;
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoursesWithProgress();
  }, []);

  const handleGetCertificate = async (courseId: string) => {
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Certificate data received:', data);
        if (data.certificate && data.certificate._id) {
          // Verify certificate exists before redirecting
          const verifyResponse = await fetch(`/api/certificates/${data.certificate._id}`);
          if (verifyResponse.ok) {
            // Redirect to certificate preview page
            router.push(`/dashboard/certificates/${data.certificate._id}`);
          } else {
            alert('Certificate was generated but could not be verified. Please try again.');
          }
        } else {
          alert('Certificate data is invalid');
        }
      } else {
        alert(data.error || 'Failed to generate certificate');
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Failed to generate certificate');
    }
  };

  const handleDownloadCertificate = async (courseId: string) => {
    try {
      // First check if certificate exists
      const checkResponse = await fetch('/api/certificates');
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        const existingCertificate = data.certificates?.find(
          (cert: any) => cert.courseId._id === courseId
        );
        
        if (existingCertificate) {
          // Download existing certificate
          await downloadCertificateHTML(existingCertificate);
        } else {
          // Generate new certificate and download
          const generateResponse = await fetch('/api/certificates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId }),
          });
          
          const generateData = await generateResponse.json();
          
          if (generateResponse.ok && generateData.certificate) {
            await downloadCertificateHTML(generateData.certificate);
          } else {
            alert(generateData.error || 'Failed to generate certificate');
          }
        }
      }
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  const downloadCertificateHTML = (certificate: any) => {
    const certificateHTML = generateCertificateHTML(certificate);
    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate-${certificate.certificateNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Certificate downloaded successfully!');
  };

  const generateCertificateHTML = (cert: any): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Certificate - ${cert.certificateNumber}</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 60px;
      border: 10px solid #667eea;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      text-align: center;
    }
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .title {
      font-size: 48px;
      color: #667eea;
      font-weight: bold;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-top: 10px;
    }
    .content {
      margin: 40px 0;
    }
    .presented-to {
      font-size: 16px;
      color: #666;
      margin-bottom: 10px;
    }
    .recipient-name {
      font-size: 36px;
      color: #333;
      font-weight: bold;
      margin: 10px 0;
      font-family: 'Georgia', serif;
    }
    .course-name {
      font-size: 24px;
      color: #667eea;
      font-weight: bold;
      margin: 20px 0;
    }
    .description {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      margin: 20px 0;
    }
    .details {
      display: flex;
      justify-content: space-around;
      margin: 40px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .detail-item {
      text-align: center;
    }
    .detail-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .detail-value {
      font-size: 18px;
      color: #333;
      font-weight: bold;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
    .certificate-number {
      font-size: 14px;
      color: #999;
      margin-bottom: 10px;
    }
    .signature {
      font-size: 16px;
      color: #666;
      margin-top: 20px;
    }
    @media print {
      body { background: white; }
      .certificate { border: none; box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <h1 class="title">Certificate of Completion</h1>
      <p class="subtitle">AdaptiveLearn Platform</p>
    </div>
    
    <div class="content">
      <p class="presented-to">This certificate is proudly presented to</p>
      <h2 class="recipient-name">${cert.userId.name}</h2>
      
      <p class="description">
        For successfully completing the course
      </p>
      
      <h3 class="course-name">${cert.courseId.title}</h3>
      
      <p class="description">
        ${cert.courseId.description}
      </p>
      
      ${cert.score !== undefined ? `
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Average Score</div>
          <div class="detail-value">${cert.score}%</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Difficulty</div>
          <div class="detail-value">${cert.courseId.difficulty}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Category</div>
          <div class="detail-value">${cert.courseId.category}</div>
        </div>
      </div>
      ` : ''}
      
      <div class="details">
        <div class="detail-item">
          <div class="detail-label">Issue Date</div>
          <div class="detail-value">${new Date(cert.issueDate).toLocaleDateString()}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Completion Date</div>
          <div class="detail-value">${new Date(cert.completionDate).toLocaleDateString()}</div>
        </div>
      </div>
    </div>
    
    <div class="footer">
      <p class="certificate-number">Certificate Number: ${cert.certificateNumber}</p>
      <p class="signature">AdaptiveLearn Official Certificate</p>
    </div>
  </div>
</body>
</html>
    `;
  };

  const fetchCoursesWithProgress = async () => {
    try {
      setLoading(true);
      
      // Fetch published courses from database
      const response = await fetch('/api/courses?published=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Fetch progress for each course
        const coursesWithProgress = await Promise.all(
          data.courses.map(async (course: any) => {
            try {
              // Always fetch modules to get accurate total count
              const modulesResponse = await fetch(`/api/modules?courseId=${course._id}`);
              const modulesData = await modulesResponse.json();
              const totalModules = modulesData.success ? modulesData.modules.length : 0;
              
              // Fetch progress for the course
              const progressResponse = await fetch(`/api/progress?courseId=${course._id}`);
              const progressData = await progressResponse.json();
              
              let completedModules = 0;
              let progressPercentage = 0;
              
              if (progressData.success && progressData.progress.length > 0) {
                completedModules = progressData.progress.filter(
                  (p: any) => p.status === 'completed'
                ).length;
                
                progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
              }
              
              return {
                _id: course._id,
                title: course.title,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                thumbnail: course.thumbnail,
                moduleCount: course.moduleCount,
                progress: progressPercentage,
                completedModules,
                totalModules,
                lastAccessed: new Date(course.createdAt).toISOString().split('T')[0],
              };
            } catch (error) {
              console.error('Error fetching progress for course:', course._id, error);
              return {
                _id: course._id,
                title: course.title,
                description: course.description,
                category: course.category,
                difficulty: course.difficulty,
                thumbnail: course.thumbnail,
                moduleCount: course.moduleCount,
                progress: 0,
                completedModules: 0,
                totalModules: 0,
                lastAccessed: new Date(course.createdAt).toISOString().split('T')[0],
              };
            }
          })
        );
        
        setCourses(coursesWithProgress);
      }
    } catch (error) {
      console.error('Error fetching courses with progress:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall stats
  const overallStats = {
    totalCourses: courses.length,
    completedCourses: courses.filter(c => c.progress === 100).length,
    inProgressCourses: courses.filter(c => c.progress > 0 && c.progress < 100).length,
    totalTimeSpent: '0h 0m', // Would need timeSpent field in progress model
    averageProgress: courses.length > 0 
      ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) 
      : 0
  };

  const getStatusColor = (progress: number) => {
    if (progress === 100) {
      return 'bg-green-100 text-green-700 border-green-200';
    } else if (progress > 0) {
      return 'bg-blue-100 text-blue-700 border-blue-200';
    } else {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusText = (progress: number) => {
    if (progress === 100) {
      return 'Completed';
    } else if (progress > 0) {
      return 'In Progress';
    } else {
      return 'Not Started';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Course Progress Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-8 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Learning Progress</h1>
        <p className="text-slate-600">Track your learning journey and achievements</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Courses</p>
                <p className="text-2xl font-bold text-slate-900">{overallStats.totalCourses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{overallStats.completedCourses}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{overallStats.inProgressCourses}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Time Spent</p>
                <p className="text-2xl font-bold text-slate-900">{overallStats.totalTimeSpent}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Progress</p>
                <p className="text-2xl font-bold text-slate-900">{overallStats.averageProgress}%</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Details */}
      <Card className="border-slate-200/60">
        <CardHeader>
          <CardTitle className="text-slate-900">Course Progress Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {courses.map((course: CourseProgress) => {
              const progressPercentage = course.progress;
              const status = progressPercentage === 100 ? 'completed' : progressPercentage > 0 ? 'in-progress' : 'not-started';
              
              return (
                <div key={course._id} className="border-b border-slate-200 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{course.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <span>{course.completedModules} of {course.totalModules} modules completed</span>
                        <span>•</span>
                        <span>Last accessed {course.lastAccessed}</span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(progressPercentage)}`}>
                      {getStatusText(progressPercentage)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Progress</span>
                      <span className="text-sm font-medium text-slate-700">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progressPercentage === 100 
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : progressPercentage > 0
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : 'bg-gradient-to-r from-slate-400 to-slate-500'
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {session?.user?.role === 'student' && (
                    <div className="flex space-x-3">
                      {status === 'not-started' ? (
                        <button
                          onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Start Course
                        </button>
                      ) : status === 'in-progress' ? (
                        <>
                          <button
                            onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            Continue Learning
                          </button>
                          <button
                          onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-200"
                        >
                          View Details
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push(`/dashboard/courses/${course._id}`)}
                          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all duration-200"
                        >
                          Review Course
                        </button>
                        <button 
                          onClick={() => handleGetCertificate(course._id)}
                          className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          View Certificate
                        </button>
                        <button 
                          onClick={() => handleDownloadCertificate(course._id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          Download
                        </button>
                      </>
                    )}
                    </div>
                  )}
                </div>
              );
            })}
            {courses.length === 0 && (
              <p className="text-center text-slate-600 py-8">No courses available. Start learning today!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
