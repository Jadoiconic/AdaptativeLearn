import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IEducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
}

export interface IPlacementQuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'interest';
  points: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: IEducationEntry[];
  careerGoals?: string;
  isActive: boolean;
  isApproved?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  placementAssessment?: {
    completed: boolean;
    score?: number;
    recommendedLevel?: 'beginner' | 'intermediate' | 'advanced';
    recommendedTrack?: string;
    completedAt?: Date;
    strengths?: string[];
    weaknesses?: string[];
  };
  // Transient answer key for the in-progress placement quiz, held server-side only
  // so submission can be graded against it instead of trusting client-reported scores.
  placementQuizDraft?: {
    generatedAt: Date;
    questions: IPlacementQuizQuestion[];
  };
  // Course selection — completed before the placement assessment.
  selectedCourse?: string;
  selectedCourseId?: mongoose.Types.ObjectId;
  selectedTrack?: string;
  courseSelectionCompleted?: boolean;
  courseSelectedAt?: Date;
  // Employment readiness score (0-100), seeded from the placement assessment and
  // intended to evolve as the learner progresses through courses.
  readinessScore?: number;
  recommendedCourses?: mongoose.Types.ObjectId[];
  generatedRoadmapId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Extend Model for proper typing (important)
interface IUserModel extends Model<IUser> {}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
    avatar: { type: String, default: '' },
    phone: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    education: [
      {
        institution: { type: String, trim: true, required: true },
        degree: { type: String, trim: true },
        fieldOfStudy: { type: String, trim: true },
        startYear: { type: Number },
        endYear: { type: Number },
      },
    ],
    careerGoals: { type: String, trim: true, maxlength: 1000, default: '' },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    placementAssessment: {
      completed: { type: Boolean, default: false },
      score: { type: Number },
      recommendedLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
      recommendedTrack: { type: String },
      completedAt: { type: Date },
      strengths: [String],
      weaknesses: [String],
    },
    placementQuizDraft: {
      generatedAt: { type: Date },
      questions: [
        {
          id: { type: String, required: true },
          type: { type: String, enum: ['multiple-choice', 'true-false', 'short-answer'], required: true },
          question: { type: String, required: true },
          options: [String],
          correctAnswer: { type: Schema.Types.Mixed, required: true },
          explanation: { type: String, required: true },
          level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'interest'], required: true },
          points: { type: Number, default: 10 },
        },
      ],
    },
    selectedCourse: { type: String, trim: true },
    selectedCourseId: { type: Schema.Types.ObjectId, ref: 'Course' },
    selectedTrack: { type: String },
    courseSelectionCompleted: { type: Boolean, default: false },
    courseSelectedAt: { type: Date },
    readinessScore: { type: Number, min: 0, max: 100 },
    recommendedCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    generatedRoadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap' },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method for password comparison
UserSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Password comparison error:', error);
    return false;
  }
};

const User = (mongoose.models.User as IUserModel) || mongoose.model<IUser, IUserModel>('User', UserSchema);

export default User;