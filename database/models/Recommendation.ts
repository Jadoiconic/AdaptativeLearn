import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  userId: mongoose.Types.ObjectId;
  suggestedModules: mongoose.Types.ObjectId[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
}

const RecommendationSchema = new Schema<IRecommendation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  suggestedModules: [{
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true,
  }],
  reasoning: {
    type: String,
    required: [true, 'Recommendation reasoning is required'],
    trim: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  },
}, {
  timestamps: true,
});

RecommendationSchema.index({ userId: 1, priority: -1 });

export default mongoose.models.Recommendation || mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);
