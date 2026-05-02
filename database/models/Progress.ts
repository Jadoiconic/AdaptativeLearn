import mongoose, { Document, Schema } from 'mongoose';

export interface IProgress extends Document {
  userId: mongoose.Types.ObjectId;
  moduleId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  timeSpent: number;
  completedAt?: Date;
}

const ProgressSchema = new Schema<IProgress>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
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
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started',
  },
  score: {
    type: Number,
    min: [0, 'Score cannot be negative'],
    max: [100, 'Score cannot exceed 100'],
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative'],
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

ProgressSchema.index({ userId: 1, courseId: 1, moduleId: 1 }, { unique: true });

export default mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);
