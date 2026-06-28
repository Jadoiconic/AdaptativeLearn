'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

interface Quiz {
  _id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  status: 'generating' | 'draft' | 'published' | 'archived';
  generatedBy: 'ai' | 'manual';
  metadata: {
    moduleTitle: string;
    generatedAt: string;
    provider?: string;
    model?: string;
  };
  createdAt: string;
}

interface InstructorQuizManagerProps {
  moduleId: string;
  courseId: string;
}

export function InstructorQuizManager({ moduleId, courseId }: InstructorQuizManagerProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [moduleId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes?moduleId=${moduleId}`);
      const data = await response.json();

      if (data.success && data.quizzes.length > 0) {
        setQuiz(data.quizzes[0]);
      } else {
        setQuiz(null);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!quiz) return;

    try {
      setRegenerating(true);
      const response = await fetch('/api/quizzes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          forceRegenerate: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Poll for quiz completion
        const pollInterval = setInterval(async () => {
          const pollResponse = await fetch(`/api/quizzes?moduleId=${moduleId}`);
          const pollData = await pollResponse.json();
          
          if (pollData.success && pollData.quizzes.length > 0) {
            const updatedQuiz = pollData.quizzes[0];
            if (updatedQuiz.status !== 'generating') {
              clearInterval(pollInterval);
              setQuiz(updatedQuiz);
              setRegenerating(false);
            }
          }
        }, 2000);
      } else {
        setError(data.error || 'Failed to regenerate quiz');
        setRegenerating(false);
      }
    } catch (error) {
      console.error('Error regenerating quiz:', error);
      setError('Failed to regenerate quiz');
      setRegenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;

    try {
      setPublishing(true);
      const response = await fetch(`/api/quizzes/${quiz._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setQuiz(data.quiz);
      } else {
        setError(data.error || 'Failed to publish quiz');
      }
    } catch (error) {
      console.error('Error publishing quiz:', error);
      setError('Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!quiz) return;

    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const response = await fetch(`/api/quizzes/${quiz._id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setQuiz(null);
      } else {
        setError(data.error || 'Failed to delete quiz');
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      setError('Failed to delete quiz');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generating':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'archived':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-10 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={fetchQuiz} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Module Assessment</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-gray-600 mb-4">No quiz has been generated for this module yet.</p>
          <Button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {regenerating ? 'Generating...' : 'Generate Quiz with AI'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(quiz.status)}`}>
              {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
            </span>
            {quiz.generatedBy === 'ai' && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                AI Generated
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {quiz.status === 'generating' ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
            <p className="text-gray-600">Generating AI assessment...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{quiz.passingScore}%</div>
                <div className="text-sm text-gray-600">Passing Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{quiz.timeLimit}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Questions</h3>
              {quiz.questions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">Q{index + 1}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                      {question.type}
                    </span>
                    <span className="text-xs text-gray-500">{question.points} pts</span>
                  </div>
                  <p className="text-sm text-gray-900 mb-2">{question.question}</p>
                  {question.options && (
                    <div className="text-sm text-gray-600 space-y-1">
                      {question.options.map((option, i) => (
                        <div key={i} className="ml-4">• {option}</div>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Correct Answer:</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              {quiz.status === 'draft' && (
                <Button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {publishing ? 'Publishing...' : 'Publish Quiz'}
                </Button>
              )}
              <Button
                onClick={handleRegenerate}
                disabled={regenerating}
                variant="outline"
              >
                {regenerating ? 'Regenerating...' : 'Regenerate with AI'}
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            </div>

            {quiz.metadata.provider && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                Generated with {quiz.metadata.provider} ({quiz.metadata.model}) on {new Date(quiz.metadata.generatedAt).toLocaleString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
