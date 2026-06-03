import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  moduleId?: mongoose.Types.ObjectId;
  activityType: 'enrolled' | 'completed_module' | 'submitted_quiz' | 'started_course';
  details: string;
  score?: number;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required'],
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
  },
  activityType: {
    type: String,
    enum: ['enrolled', 'completed_module', 'submitted_quiz', 'started_course'],
    required: [true, 'Activity type is required'],
  },
  details: {
    type: String,
    required: [true, 'Activity details are required'],
    trim: true,
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
}, {
  timestamps: true,
});

ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ courseId: 1, createdAt: -1 });

export default mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
