import mongoose, { Document, Schema } from 'mongoose';

export interface IExpertReview extends Document {
  instructorId: mongoose.Types.ObjectId;
  targetUserId: mongoose.Types.ObjectId;
  roadmapId?: mongoose.Types.ObjectId;
  skillGapAnalysisId?: mongoose.Types.ObjectId;
  overallRating: number;
  approvalStatus: 'pending' | 'approved' | 'needs-revision';
  comments: string;
  suggestedChanges: string[];
  strengths: string[];
  areasToImprove: string[];
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpertReviewSchema = new Schema<IExpertReview>(
  {
    instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap' },
    skillGapAnalysisId: { type: Schema.Types.ObjectId, ref: 'SkillGapAnalysis' },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'needs-revision'],
      default: 'pending',
    },
    comments: { type: String, required: true, trim: true, maxlength: 3000 },
    suggestedChanges: { type: [String], default: [] },
    strengths: { type: [String], default: [] },
    areasToImprove: { type: [String], default: [] },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ExpertReviewSchema.index({ targetUserId: 1, createdAt: -1 });

export default mongoose.models.ExpertReview ||
  mongoose.model<IExpertReview>('ExpertReview', ExpertReviewSchema);
