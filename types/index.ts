export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Course {
  _id?: string;
  title: string;
  description: string;
  category: 'imaging' | 'networking' | 'graphic-design' | 'software-development';
  instructorId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  thumbnail?: string;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Module {
  _id?: string;
  courseId: string;
  title: string;
  description: string;
  content: string;
  order: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'lesson' | 'video' | 'quiz' | 'exercise';
  videoUrl?: string;
  fileUrl?: string;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Progress {
  _id?: string;
  userId: string;
  moduleId: string;
  courseId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  score?: number;
  timeSpent: number; // in minutes
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recommendation {
  _id?: string;
  userId: string;
  suggestedModules: string[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: Date;
  expiresAt?: Date;
}

export interface Quiz {
  _id?: string;
  moduleId: string;
  title: string;
  questions: Question[];
  timeLimit?: number; // in minutes
  passingScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  _id?: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalModules: number;
  activeUsers: number;
  completionRate: number;
  averageScore: number;
}

export interface LearningPath {
  userId: string;
  currentModule: string;
  nextModules: string[];
  completedModules: string[];
  estimatedCompletion: Date;
  progress: number;
}
