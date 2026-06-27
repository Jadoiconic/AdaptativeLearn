import mongoose, { Document, Schema } from 'mongoose';

export interface IRoadmapStep {
  courseId: mongoose.Types.ObjectId;
  order: number;
  status: 'available' | 'in_progress' | 'completed';
}

export interface IRoadmap extends Document {
  userId: mongoose.Types.ObjectId;
  targetLevel: 'beginner' | 'intermediate' | 'advanced';
  steps: IRoadmapStep[];
  isActive: boolean;
  generatedAt: Date;
}

const RoadmapStepSchema = new Schema<IRoadmapStep>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  order: { type: Number, required: true },
  status: {
    type: String,
    enum: ['available', 'in_progress', 'completed'],
    default: 'available',
  },
});

const RoadmapSchema = new Schema<IRoadmap>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    steps: [RoadmapStepSchema],
    isActive: { type: Boolean, default: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

RoadmapSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.Roadmap || mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);
