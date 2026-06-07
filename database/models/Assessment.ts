import mongoose, { Document, Schema } from 'mongoose';

export interface IAssessment extends Document {
  moduleId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  questions: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    points: number;
  }>;
  passingScore: number;
  timeLimit?: number; // in minutes
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>({
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required'],
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Assessment title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  questions: [{
    question: {
      type: String,
      required: [true, 'Question text is required'],
    },
    options: {
      type: [String],
      required: [true, 'Options are required'],
      validate: {
        validator: function(v: string[]) {
          return v.length >= 2;
        },
        message: 'At least 2 options are required',
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Correct answer index is required'],
      min: 0,
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
  }],
  passingScore: {
    type: Number,
    required: [true, 'Passing score is required'],
    min: 0,
    max: 100,
    default: 60,
  },
  timeLimit: {
    type: Number,
    min: 1,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

AssessmentSchema.index({ moduleId: 1 });
AssessmentSchema.index({ courseId: 1 });

export default mongoose.models.Assessment || mongoose.model<IAssessment>('Assessment', AssessmentSchema);
