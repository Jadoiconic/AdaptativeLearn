import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IQuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
}

export interface IQuiz extends Document {
  moduleId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  questions: IQuizQuestion[];
  passingScore: number;
  timeLimit?: number;
  status: 'generating' | 'draft' | 'published' | 'archived';
  generatedBy: 'ai' | 'manual';
  metadata: {
    moduleTitle: string;
    generatedAt: Date;
    provider?: string;
    model?: string;
    regeneratedAt?: Date;
    regeneratedBy?: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  id: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['multiple-choice', 'true-false', 'short-answer'],
    required: true 
  },
  question: { type: String, required: true },
  options: [String],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    required: true 
  },
  points: { type: Number, default: 10 },
});

const QuizSchema = new Schema<IQuiz>(
  {
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
    title: { type: String, required: true },
    description: { type: String, required: true },
    questions: [QuizQuestionSchema],
    passingScore: { type: Number, default: 70, min: 0, max: 100 },
    timeLimit: { type: Number, default: 30 }, // in minutes
    status: { 
      type: String, 
      enum: ['generating', 'draft', 'published', 'archived'],
      default: 'generating',
      index: true 
    },
    generatedBy: { 
      type: String, 
      enum: ['ai', 'manual'],
      default: 'ai' 
    },
    metadata: {
      moduleTitle: { type: String, required: true },
      generatedAt: { type: Date, default: Date.now },
      provider: String,
      model: String,
      regeneratedAt: Date,
      regeneratedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
QuizSchema.index({ moduleId: 1, status: 1 });
QuizSchema.index({ courseId: 1, status: 1 });

export const QuizModel = (mongoose.models.Quiz as Model<IQuiz>) || mongoose.model<IQuiz>('Quiz', QuizSchema);
export default QuizModel;
