import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuizAnswer {
  questionId: string;
  selectedAnswer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent?: number; // in seconds
}

export interface IQuizResult extends Document {
  quizId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IQuizAnswer[];
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  timeTaken: number; // in seconds
  startedAt: Date;
  completedAt: Date;
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced';
  feedback: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuizAnswerSchema = new Schema<IQuizAnswer>({
  questionId: { type: String, required: true },
  selectedAnswer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  pointsEarned: { type: Number, required: true },
  timeSpent: { type: Number, default: 0 },
});

const QuizResultSchema = new Schema<IQuizResult>(
  {
    quizId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Quiz',
      required: true,
      index: true 
    },
    moduleId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Module',
      required: true,
      index: true 
    },
    courseId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Course',
      required: true,
      index: true 
    },
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true,
      index: true 
    },
    answers: [QuizAnswerSchema],
    score: { type: Number, required: true, default: 0 },
    totalPoints: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    passed: { type: Boolean, required: true, default: false },
    timeTaken: { type: Number, required: true, default: 0 }, // in seconds
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: true },
    recommendedLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true 
    },
    feedback: {
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
QuizResultSchema.index({ studentId: 1, quizId: 1 });
QuizResultSchema.index({ studentId: 1, moduleId: 1 });
QuizResultSchema.index({ courseId: 1, studentId: 1 });

export const QuizResultModel = (mongoose.models.QuizResult as Model<IQuizResult>) || mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);
export default QuizResultModel;
