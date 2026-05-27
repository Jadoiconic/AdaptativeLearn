import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  instructorId: mongoose.Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  price?: number;
  thumbnail?: string;
  objectives?: string[];
  requirements?: string[];
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
  price: {
    type: Number,
    default: 0,
    min: [0, 'Price must be at least 0'],
  },
  thumbnail: {
    type: String,
    default: '',
  },
  objectives: {
    type: [String],
    default: [],
  },
  requirements: {
    type: [String],
    default: [],
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
