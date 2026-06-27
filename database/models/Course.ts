import mongoose, { Document, Schema } from 'mongoose';

export const COURSE_CATEGORIES = [
  'Networking',
  'CCTV Camera Systems',
  'Embedded Systems',
  'Software Development',
] as const;

export type CourseCategory = typeof COURSE_CATEGORIES[number];

export interface ICourse extends Document {
  title: string;
  description: string;
  category: CourseCategory;
  instructorId: mongoose.Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  thumbnail?: string;
  skillsCovered: string[];
  learningObjectives: string[];
  internshipReadinessOutcomes: string[];
  modules: string[];
  aiQuizEnabled: boolean;
  moduleCount?: number;
  isPublished: boolean;
}

const CourseSchema = new Schema<ICourse>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    enum: {
      values: COURSE_CATEGORIES,
      message: `Category must be one of: ${COURSE_CATEGORIES.join(', ')}`,
    },
    trim: true,
  },
  instructorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required'],
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  },
  duration: {
    type: String,
    required: [true, 'Course duration is required'],
    trim: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  skillsCovered: {
    type: [String],
    default: [],
  },
  learningObjectives: {
    type: [String],
    default: [],
  },
  internshipReadinessOutcomes: {
    type: [String],
    default: [],
  },
  modules: {
    type: [String],
    default: [],
  },
  aiQuizEnabled: {
    type: Boolean,
    default: false,
  },
  moduleCount: {
    type: Number,
    default: 0,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
