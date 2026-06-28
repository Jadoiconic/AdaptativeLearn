import mongoose, { Document, Schema } from 'mongoose';

export type ResourceType =
  | 'video'
  | 'pdf'
  | 'documentation'
  | 'tutorial'
  | 'exercise'
  | 'lab'
  | 'project'
  | 'quiz'
  | 'external-link';

export interface IResource extends Document {
  title: string;
  description: string;
  type: ResourceType;
  url?: string;
  thumbnail?: string;
  duration?: string;
  skillTags: string[];
  track?: string;
  roadmapPhase?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  verifiedByExpert: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  votes: number;
  voterIds: mongoose.Types.ObjectId[];
  addedBy: mongoose.Types.ObjectId;
  source: 'curated' | 'community' | 'ai-generated';
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['video', 'pdf', 'documentation', 'tutorial', 'exercise', 'lab', 'project', 'quiz', 'external-link'],
      required: true,
    },
    url: { type: String, trim: true },
    thumbnail: { type: String, trim: true },
    duration: { type: String, trim: true },
    skillTags: { type: [String], default: [] },
    track: { type: String, trim: true },
    roadmapPhase: { type: Number, min: 1, max: 6 },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    verifiedByExpert: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    votes: { type: Number, default: 0 },
    voterIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    source: {
      type: String,
      enum: ['curated', 'community', 'ai-generated'],
      default: 'curated',
    },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ResourceSchema.index({ track: 1, difficulty: 1 });
ResourceSchema.index({ skillTags: 1 });
ResourceSchema.index({ verifiedByExpert: -1, votes: -1 });

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);
