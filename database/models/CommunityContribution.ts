import mongoose, { Document, Schema } from 'mongoose';

export type ContributionType = 'resource' | 'project-idea' | 'discussion' | 'feedback' | 'report';

export interface ICommunityContribution extends Document {
  userId: mongoose.Types.ObjectId;
  contributionType: ContributionType;
  title: string;
  content: string;
  url?: string;
  skillTags: string[];
  track?: string;
  votes: number;
  voterIds: mongoose.Types.ObjectId[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommunityContributionSchema = new Schema<ICommunityContribution>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    contributionType: {
      type: String,
      enum: ['resource', 'project-idea', 'discussion', 'feedback', 'report'],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    url: { type: String, trim: true },
    skillTags: { type: [String], default: [] },
    track: { type: String, trim: true },
    votes: { type: Number, default: 0 },
    voterIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNote: { type: String, trim: true },
  },
  { timestamps: true }
);

CommunityContributionSchema.index({ status: 1, votes: -1 });
CommunityContributionSchema.index({ track: 1, status: 1 });

export default mongoose.models.CommunityContribution ||
  mongoose.model<ICommunityContribution>('CommunityContribution', CommunityContributionSchema);
