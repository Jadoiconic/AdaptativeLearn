'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
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
    title: string;
    description: string;
    category: string;
    difficulty: string;
  };
}

export default function CertificatePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (params.certificateId) {
      fetchCertificate(params.certificateId as string);
    }
  }, [params.certificateId]);

  const fetchCertificate = async (certificateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/${certificateId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch certificate');
      }
      
      const data = await response.json();
      setCertificate(data.certificate);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      alert(error instanceof Error ? error.message : 'Failed to fetch certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!certificate) return;
    
    setDownloading(true);
    try {
      // Create a simple HTML-based certificate download
      const certificateHTML = generateCertificateHTML(certificate);
      
      // Create a blob and download
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
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    } finally {
      setDownloading(false);
    }
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
      <div className="max-w-4xl mx-auto p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Certificate Not Found</h2>
            <p className="text-gray-600 mb-4">The certificate you're looking for doesn't exist or you don't have access to it.</p>
            <Button onClick={() => router.push('/dashboard/progress')}>
              Back to Progress
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/progress')}
        >
          ← Back to Progress
        </Button>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {downloading ? 'Downloading...' : 'Download Certificate'}
        </Button>
      </div>

      <Card className="border-4 border-blue-600 shadow-2xl">
        <CardContent className="p-0">
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-2 tracking-wider">CERTIFICATE OF COMPLETION</h1>
            <p className="text-lg opacity-90">AdaptiveLearn Platform</p>
          </div>
          
          <div className="p-12 text-center">
            <p className="text-gray-600 mb-2">This certificate is proudly presented to</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">{certificate.userId.name}</h2>
            
            <p className="text-gray-600 mb-4">For successfully completing the course</p>
            <h3 className="text-3xl font-bold text-blue-600 mb-4">{certificate.courseId.title}</h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">{certificate.courseId.description}</p>
            
            {certificate.score !== undefined && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{certificate.score}%</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Difficulty</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{certificate.courseId.difficulty}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-2xl font-bold text-gray-900 capitalize">{certificate.courseId.category}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Issue Date</p>
                <p className="text-xl font-bold text-gray-900">{new Date(certificate.issueDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Completion Date</p>
                <p className="text-xl font-bold text-gray-900">{new Date(certificate.completionDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Certificate Number: {certificate.certificateNumber}</p>
              <p className="text-sm text-gray-500">AdaptiveLearn Official Certificate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
