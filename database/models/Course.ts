import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: 'imaging' | 'networking' | 'graphic-design' | 'software-development';
  instructorId: mongoose.Types.ObjectId;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  thumbnail?: string;
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
    enum: ['imaging', 'networking', 'graphic-design', 'software-development'],
    required: [true, 'Course category is required'],
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
    type: Number,
    required: [true, 'Course duration is required'],
    min: [1, 'Duration must be at least 1 hour'],
  },
  thumbnail: {
    type: String,
    default: '',
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
