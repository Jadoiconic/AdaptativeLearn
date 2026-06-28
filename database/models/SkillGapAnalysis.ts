import mongoose, { Document, Schema } from 'mongoose';

export interface ISkillGap {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  estimatedHours: number;
}

export interface IRoadmapPhase {
  phase: number;
  title: string;
  description: string;
  skills: string[];
  topics: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface IReadinessScores {
  technicalSkills: number;
  practicalReadiness: number;
  internshipReadiness: number;
  overall: number;
}

export interface ISkillGapAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  track: string;
  inputSkills: string[];
  skillGaps: ISkillGap[];
  masteredSkills: string[];
  roadmap: IRoadmapPhase[];
  readinessScores: IReadinessScores;
  estimatedDuration: string;
  nextSteps: string[];
  aiNotes: string;
  generatedAt: Date;
}

const SkillGapSchema = new Schema<ISkillGap>(
  {
    skill: { type: String, required: true },
    priority: { type: String, enum: ['high', 'medium', 'low'], required: true },
    reason: { type: String, required: true },
    estimatedHours: { type: Number, default: 20 },
  },
  { _id: false }
);

const RoadmapPhaseSchema = new Schema<IRoadmapPhase>(
  {
    phase: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String },
    skills: [String],
    topics: [String],
    estimatedDuration: { type: String },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  },
  { _id: false }
);

const SkillGapAnalysisSchema = new Schema<ISkillGapAnalysis>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    track: { type: String, required: true },
    inputSkills: [String],
    skillGaps: [SkillGapSchema],
    masteredSkills: [String],
    roadmap: [RoadmapPhaseSchema],
    readinessScores: {
      technicalSkills: { type: Number, default: 0 },
      practicalReadiness: { type: Number, default: 0 },
      internshipReadiness: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    estimatedDuration: { type: String },
    nextSteps: [String],
    aiNotes: { type: String },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SkillGapAnalysisSchema.index({ userId: 1, generatedAt: -1 });

export default mongoose.models.SkillGapAnalysis ||
  mongoose.model<ISkillGapAnalysis>('SkillGapAnalysis', SkillGapAnalysisSchema);
