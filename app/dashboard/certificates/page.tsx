'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Certificate {
  _id: string;
  certificateNumber: string;
  issueDate: string;
  completionDate: string;
  score?: number;
  isValid: boolean;
  userId: {
    name: string;
    email: string;
  };
  courseId: {
    _id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
  };
}

export default function CertificatesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/certificates');
      
      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }
      
      const data = await response.json();
      setCertificates(data.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (certificate: Certificate) => {
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

  const generateCertificateHTML = (cert: Certificate): string => {
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Certificates</h1>
        <p className="text-gray-600">View and download your course completion certificates</p>
      </div>

      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Certificates Yet</h2>
            <p className="text-gray-600 mb-6">Complete courses to earn certificates</p>
            <Button onClick={() => router.push('/dashboard/progress')}>
              Browse Courses
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{certificate.courseId.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Certificate Number:</span>
                    <span className="font-medium text-gray-900">{certificate.certificateNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Issue Date:</span>
                    <span className="font-medium text-gray-900">{new Date(certificate.issueDate).toLocaleDateString()}</span>
                  </div>
                  {certificate.score !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Score:</span>
                      <span className="font-medium text-gray-900">{certificate.score}%</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      certificate.isValid 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {certificate.isValid ? 'Valid' : 'Invalid'}
                    </span>
                  </div>
                  <div className="pt-3 flex gap-2">
                    <Button
                      onClick={() => router.push(`/dashboard/certificates/${certificate._id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      View
                    </Button>
                    <Button
                      onClick={() => handleDownload(certificate)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
