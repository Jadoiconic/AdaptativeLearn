import mongoose, { Document, Schema } from 'mongoose';

export interface ICertificate extends Document {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  certificateNumber: string;
  issueDate: Date;
  completionDate: Date;
  score?: number;
  isValid: boolean;
}

const CertificateSchema = new Schema<ICertificate>({
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
  certificateNumber: {
    type: String,
    required: [true, 'Certificate number is required'],
    unique: true,
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required'],
    default: Date.now,
  },
  completionDate: {
    type: Date,
    required: [true, 'Completion date is required'],
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
  },
  isValid: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

CertificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });
CertificateSchema.index({ certificateNumber: 1 });

export default mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
