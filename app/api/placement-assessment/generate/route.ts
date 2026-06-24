import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/database/connection';
import { UserModel } from '@/database/models';
import { aiService, GeneratedLevelAssessment, LevelAssessmentQuestion } from '@/lib/ai-service';

const ASSESSMENT_DOMAIN = 'General Programming and Technical Aptitude';

// Strip correct answers/explanations before sending the quiz to the client,
// otherwise the level test can be trivially gamed by reading the response body.
function sanitizeForClient(assessment: GeneratedLevelAssessment) {
  return {
    ...assessment,
    questions: assessment.questions.map(({ correctAnswer, explanation, ...rest }) => rest),
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already completed placement assessment
    if (user.placementAssessment?.completed) {
      return NextResponse.json(
        { success: false, error: 'Placement assessment already completed', result: user.placementAssessment },
        { status: 409 }
      );
    }

    let assessment: GeneratedLevelAssessment;

    const provider = process.env.AI_PROVIDER || 'openai';
    const apiKey = provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log('AI provider not configured, using fallback level assessment');
      assessment = getFallbackLevelAssessment();
    } else {
      try {
        assessment = await aiService.generateLevelAssessment(ASSESSMENT_DOMAIN);
      } catch (aiError) {
        console.error('AI level assessment generation failed, using fallback:', aiError);
        assessment = getFallbackLevelAssessment();
      }
    }

    // Persist the answer key server-side so submission can be graded against it
    // instead of trusting client-reported correctness.
    user.placementQuizDraft = {
      generatedAt: new Date(),
      questions: assessment.questions as LevelAssessmentQuestion[],
    };
    await user.save();

    return NextResponse.json({
      success: true,
      quiz: sanitizeForClient(assessment),
    });
  } catch (error) {
    console.error('Generate placement assessment error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate placement assessment' },
      { status: 500 }
    );
  }
}

function getFallbackLevelAssessment(): GeneratedLevelAssessment {
  return {
    title: 'Skill Level Placement Assessment',
    description: 'Evaluate your current programming and technical skill level',
    timeLimit: 30,
    metadata: {
      domain: ASSESSMENT_DOMAIN,
      generatedAt: new Date().toISOString(),
      provider: 'fallback',
      model: 'static',
    },
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'What does "variable" mean in programming?',
        options: [
          'A named storage location that holds a value',
          'A fixed value that never changes',
          'A type of loop',
          'A function with no name',
        ],
        correctAnswer: 'A named storage location that holds a value',
        explanation: 'A variable is a named container used to store a value that can change during program execution.',
        level: 'beginner',
        points: 10,
      },
      {
        id: 'q2',
        type: 'true-false',
        question: 'In most programming languages, array indexing starts at 0.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Most languages (JavaScript, Python, C, Java) use zero-based indexing for arrays.',
        level: 'beginner',
        points: 10,
      },
      {
        id: 'q3',
        type: 'multiple-choice',
        question: 'Which of these is used to repeat a block of code multiple times?',
        options: ['A loop', 'A variable', 'A comment', 'A string'],
        correctAnswer: 'A loop',
        explanation: 'Loops (for, while) are used to repeat a block of code.',
        level: 'beginner',
        points: 10,
      },
      {
        id: 'q4',
        type: 'true-false',
        question: 'A function can return a value back to the code that called it.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Functions can use a return statement to send a value back to the caller.',
        level: 'beginner',
        points: 10,
      },
      {
        id: 'q5',
        type: 'multiple-choice',
        question: 'What is the time complexity of searching for an item in a sorted array using binary search?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctAnswer: 'O(log n)',
        explanation: 'Binary search halves the search space each step, giving logarithmic time complexity.',
        level: 'intermediate',
        points: 10,
      },
      {
        id: 'q6',
        type: 'multiple-choice',
        question: 'In REST APIs, which HTTP method is typically used to partially update a resource?',
        options: ['GET', 'POST', 'PATCH', 'DELETE'],
        correctAnswer: 'PATCH',
        explanation: 'PATCH is used for partial updates, while PUT typically replaces the full resource.',
        level: 'intermediate',
        points: 10,
      },
      {
        id: 'q7',
        type: 'true-false',
        question: 'A hash map (dictionary) allows average O(1) lookups by key.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: 'Hash maps use a hash function to provide average constant-time lookups.',
        level: 'intermediate',
        points: 10,
      },
      {
        id: 'q8',
        type: 'multiple-choice',
        question: 'What is the main purpose of version control systems like Git?',
        options: [
          'Track and manage changes to code over time',
          'Compile source code into binaries',
          'Encrypt sensitive data',
          'Render user interfaces',
        ],
        correctAnswer: 'Track and manage changes to code over time',
        explanation: 'Git tracks changes, enables collaboration, and allows reverting to previous states.',
        level: 'intermediate',
        points: 10,
      },
      {
        id: 'q9',
        type: 'multiple-choice',
        question: 'Which approach best avoids race conditions when multiple threads update shared state?',
        options: [
          'Using locks/mutexes or atomic operations',
          'Adding more print statements',
          'Increasing the number of threads',
          'Avoiding the use of variables',
        ],
        correctAnswer: 'Using locks/mutexes or atomic operations',
        explanation: 'Synchronization primitives like locks or atomic operations prevent concurrent writes from corrupting shared state.',
        level: 'advanced',
        points: 10,
      },
      {
        id: 'q10',
        type: 'short-answer',
        question: 'Name one tradeoff of denormalizing a relational database schema for read performance.',
        correctAnswer: 'data duplication',
        explanation: 'Denormalization improves read speed but introduces data duplication and the risk of inconsistency on updates.',
        level: 'advanced',
        points: 10,
      },
      {
        id: 'q11',
        type: 'multiple-choice',
        question: 'In a microservices architecture, what is the primary purpose of an API gateway?',
        options: [
          'Route, authenticate, and aggregate requests to backend services',
          'Store application data permanently',
          'Compile frontend JavaScript',
          'Replace the need for a database',
        ],
        correctAnswer: 'Route, authenticate, and aggregate requests to backend services',
        explanation: 'An API gateway centralizes cross-cutting concerns like routing, auth, and rate limiting in front of microservices.',
        level: 'advanced',
        points: 10,
      },
      {
        id: 'q12',
        type: 'true-false',
        question: 'Eventual consistency guarantees that all reads immediately reflect the latest write in a distributed system.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Eventual consistency only guarantees that, given no new updates, all replicas will converge over time — not immediately.',
        level: 'advanced',
        points: 10,
      },
    ],
  };
}
