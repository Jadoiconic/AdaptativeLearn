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
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  status: 'generating' | 'draft' | 'published' | 'archived';
}

interface QuizResult {
  _id: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  answers: Array<{
    questionId: string;
    selectedAnswer: string | string[];
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

interface StudentAssessmentProps {
  moduleId: string;
  onAssessmentComplete?: (result: QuizResult) => void;
}

export function StudentAssessment({ moduleId, onAssessmentComplete }: StudentAssessmentProps) {
  const { data: session } = useSession();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [moduleId]);

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

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes?moduleId=${moduleId}`);
      const data = await response.json();

      if (data.success && data.quizzes.length > 0) {
        const publishedQuiz = data.quizzes.find((q: Quiz) => q.status === 'published');
        
        if (publishedQuiz) {
          // Check if student already submitted
          const resultResponse = await fetch(`/api/quiz-results?quizId=${publishedQuiz._id}`);
          const resultData = await resultResponse.json();
          
          if (resultData.success && resultData.results.length > 0) {
            setResult(resultData.results[0]);
            setShowResult(true);
          } else {
            setQuiz(publishedQuiz);
            setTimeRemaining(publishedQuiz.timeLimit * 60); // Convert to seconds
          }
        } else {
          setError('No published quiz available for this module');
        }
      } else {
        setError('No quiz available for this module');
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      setError('Failed to load quiz');
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
    if (!quiz || !session?.user) return;

    try {
      setSubmitting(true);
      
      const formattedAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || '',
        timeSpent: 0, // Could track per-question time
      }));

      const timeTaken = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;

      const response = await fetch('/api/quiz-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz._id,
          answers: formattedAnswers,
          timeTaken,
          startedAt: startedAt?.toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.result);
        setShowResult(true);
        onAssessmentComplete?.(data.result);
      } else {
        setError(data.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                <Skeleton className="h-10 w-3/4" />
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
          <p className="text-gray-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (showResult && result) {
    return <QuizResultView result={result} />;
  }

  if (!quiz) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No quiz available</p>
        </CardContent>
      </Card>
    );
  }

  if (!startedAt) {
    return <QuizStartView quiz={quiz} onStart={handleStart} />;
  }

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Card className="w-full">
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
              {submitting ? 'Submitting...' : 'Submit Quiz'}
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
  );
}

function QuizStartView({ quiz, onStart }: { quiz: Quiz; onStart: () => void }) {
  return (
    <Card className="w-full">
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
            <div className="text-2xl font-bold text-green-600">{quiz.passingScore}%</div>
            <div className="text-sm text-gray-600">Passing Score</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{quiz.timeLimit}</div>
            <div className="text-sm text-gray-600">Minutes</div>
          </div>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            <strong>Important:</strong> This assessment will evaluate your current knowledge level. 
            The results will help recommend the appropriate learning path for you.
          </p>
        </div>
        <Button onClick={onStart} className="w-full bg-blue-600 hover:bg-blue-700">
          Start Assessment
        </Button>
      </CardContent>
    </Card>
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
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <span className="text-sm text-gray-500">{question.points} points</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900">{question.question}</h3>
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
              <span>{option}</span>
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
              <span>{option}</span>
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

function QuizResultView({ result }: { result: QuizResult }) {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'advanced':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Beginner Level';
      case 'intermediate':
        return 'Intermediate Level';
      case 'advanced':
        return 'Advanced Level';
      default:
        return level;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assessment Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl font-bold text-blue-600 mb-2">{result.percentage}%</div>
          <p className="text-xl text-gray-600">
            {result.passed ? 'Passed' : 'Not Passed'}
          </p>
          <div className="mt-4">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getLevelColor(result.recommendedLevel)}`}>
              Recommended: {getLevelLabel(result.recommendedLevel)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{result.score}</div>
            <div className="text-sm text-gray-600">Points Earned</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{result.totalPoints}</div>
            <div className="text-sm text-gray-600">Total Points</div>
          </div>
        </div>

        {result.feedback.strengths.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
            <ul className="text-sm text-green-700 space-y-1">
              {result.feedback.strengths.map((strength, index) => (
                <li key={index}>• {strength}</li>
              ))}
            </ul>
          </div>
        )}

        {result.feedback.weaknesses.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <h4 className="font-medium text-red-800 mb-2">Areas for Improvement</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {result.feedback.weaknesses.map((weakness, index) => (
                <li key={index}>• {weakness}</li>
              ))}
            </ul>
          </div>
        )}

        {result.feedback.recommendations.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {result.feedback.recommendations.map((recommendation, index) => (
                <li key={index}>• {recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
