'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'interest';
  points: number;
}

interface GeneratedQuiz {
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number;
  metadata: {
    domain: string;
    generatedAt: string;
    provider: string;
    model: string;
  };
}

interface PlacementResult {
  completed: boolean;
  score: number;
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  completedAt: string;
  strengths: string[];
  weaknesses: string[];
}

export function PlacementAssessment() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [quiz, setQuiz] = useState<GeneratedQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      checkPlacementStatus();
    }
  }, [status]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeRemaining > 0 && !showResult && startedAt) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeRemaining, showResult, startedAt]);

  const checkPlacementStatus = async () => {
    try {
      setLoading(true);
      // Check completion against the database, not the session: the JWT session
      // only reflects placementAssessment as of last login, so it can be stale
      // for the rest of the session after a student submits the assessment.
      const response = await fetch('/api/users/me');
      const data = await response.json();

      if (data.user?.placementAssessment?.completed) {
        router.push('/dashboard');
        return;
      }

      // Generate placement assessment
      await generateQuiz();
    } catch (error) {
      console.error('Error checking placement status:', error);
      setError('Failed to load placement assessment');
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    try {
      const response = await fetch('/api/placement-assessment/generate', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setQuiz(data.quiz);
        setTimeRemaining(data.quiz.timeLimit ? data.quiz.timeLimit * 60 : 1800); // Default 30 minutes
      } else if (data.result?.completed) {
        // Already completed (e.g. a stale tab) — just move on, no error needed.
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to generate placement assessment');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate placement assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleStart = () => {
    setStartedAt(new Date());
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    try {
      setSubmitting(true);
      
      // Correctness is graded server-side against the stored answer key.
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || '',
      }));

      const timeTaken = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;

      const response = await fetch('/api/placement-assessment/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          timeTaken,
          startedAt: startedAt?.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setShowResult(true);
        // Refresh the JWT session immediately so it doesn't keep reporting
        // "not completed" for the rest of this session (see dashboard layout's gate).
        await updateSession({ placementAssessment: data.result });
      } else if (response.status === 409) {
        // Already submitted (e.g. double-fired by the auto-submit timer) — no error needed.
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to submit assessment');
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContinue = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
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
                  <Skeleton className="h-10 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={checkPlacementStatus} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Placement Assessment Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-blue-600 mb-2">{result.score}%</div>
              <p className="text-xl text-gray-600">Assessment Completed</p>
              <div className="mt-4">
                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  result.recommendedLevel === 'beginner' ? 'bg-green-100 text-green-700 border-green-200' :
                  result.recommendedLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-purple-100 text-purple-700 border-purple-200'
                }`}>
                  Recommended Level: {result.recommendedLevel.charAt(0).toUpperCase() + result.recommendedLevel.slice(1)}
                </span>
              </div>
            </div>

            {result.strengths.length > 0 && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {result.strengths.map((strength, index) => (
                    <li key={index}>• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.weaknesses.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {result.weaknesses.map((weakness, index) => (
                    <li key={index}>• {weakness}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={handleContinue} className="w-full bg-blue-600 hover:bg-blue-700">
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">No assessment available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!startedAt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-gray-600 mt-2">{quiz.description}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">4</div>
                <div className="text-sm text-gray-600">Career Tracks</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{quiz.timeLimit || 30}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            </div>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-sm text-blue-700">
                <strong>How it works:</strong> The first 4 questions identify your preferred career track
                (Networking, Embedded Systems, CCTV, or Software Development). The remaining questions
                assess your technical skill level (Beginner, Intermediate, or Advanced). Together they
                generate a personalized learning roadmap.
              </p>
            </div>
            <Button onClick={handleStart} className="w-full bg-blue-600 hover:bg-blue-700">
              Start Placement Assessment
            </Button>
            <p className="text-center text-sm text-gray-500 mt-3">
              Want to choose a different track?{' '}
              <button
                onClick={() => router.push('/course-selection')}
                className="text-blue-600 hover:underline font-medium"
              >
                Change course
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{quiz.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(timeRemaining)}
              </div>
              <p className="text-xs text-gray-500">Time Remaining</p>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <QuestionView
            question={question}
            answer={answers[question.id]}
            onAnswer={(answer) => handleAnswer(question.id, answer)}
          />
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={submitting || !answers[question.id]}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
                disabled={!answers[question.id]}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestionView({
  question,
  answer,
  onAnswer,
}: {
  question: QuizQuestion;
  answer: string | string[] | undefined;
  onAnswer: (answer: string | string[]) => void;
}) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      case 'interest':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isInterest = question.level === 'interest';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {isInterest ? (
            <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
              Track Selection
            </span>
          ) : (
            <>
              <span className={`px-2 py-1 text-xs font-medium rounded ${getLevelColor(question.level)}`}>
                {question.level}
              </span>
              <span className="text-sm text-gray-500">{question.points} points</span>
            </>
          )}
        </div>
        <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
        {isInterest && (
          <p className="text-sm text-gray-500 mt-1">Help us understand your interests — there are no right or wrong answers.</p>
        )}
      </div>

      {question.type === 'multiple-choice' && question.options && (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <label
              key={index}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                answer === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswer(e.target.value)}
                className="mr-3"
              />
              <span className='text-slate-800'>{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'true-false' && (
        <div className="space-y-3">
          {['True', 'False'].map((option) => (
            <label
              key={option}
              className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                answer === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option}
                checked={answer === option}
                onChange={(e) => onAnswer(e.target.value)}
                className="mr-3"
              />
              <span className='text-slate-800'>{option}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'short-answer' && (
        <textarea
          value={answer as string || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
        />
      )}
    </div>
  );
}
