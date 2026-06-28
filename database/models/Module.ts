import mongoose, { Document, Schema } from 'mongoose';

export interface IModule extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  content: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'lesson' | 'video' | 'pdf' | 'tutorial' | 'exercise' | 'quiz' | 'assignment' | 'lab';
  objectives: string[];
  estimatedTime: string;
  skillsCovered: string[];
  aiQuizEnabled: boolean;
  internshipOutcome: string;
  videoUrl?: string;
  fileUrl?: string;
  assessmentId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  isPublished: boolean;
}

const ModuleSchema = new Schema<IModule>({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Module description is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Module content is required'],
  },
  order: {
    type: Number,
    required: [true, 'Module order is required'],
    min: [1, 'Order must be at least 1'],
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  type: {
    type: String,
    enum: ['lesson', 'video', 'pdf', 'tutorial', 'exercise', 'quiz', 'assignment', 'lab'],
    default: 'lesson',
  },
  objectives: {
    type: [String],
    default: [],
  },
  estimatedTime: {
    type: String,
    default: '',
    trim: true,
  },
  skillsCovered: {
    type: [String],
    default: [],
  },
  aiQuizEnabled: {
    type: Boolean,
    default: false,
  },
  internshipOutcome: {
    type: String,
    default: '',
    trim: true,
  },
  videoUrl: {
    type: String,
    default: '',
  },
  fileUrl: {
    type: String,
    default: '',
  },
  assessmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assessment',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

ModuleSchema.index({ courseId: 1, order: 1 });

export default mongoose.models.Module || mongoose.model<IModule>('Module', ModuleSchema);
