import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      approvalStatus?: string;
      isActive?: boolean;
      placementAssessment?: {
        completed: boolean;
        score?: number;
        recommendedLevel?: 'beginner' | 'intermediate' | 'advanced';
        completedAt?: Date;
        strengths?: string[];
        weaknesses?: string[];
      };
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
    approvalStatus?: string;
    isActive?: boolean;
    placementAssessment?: {
      completed: boolean;
      score?: number;
      recommendedLevel?: 'beginner' | 'intermediate' | 'advanced';
      completedAt?: Date;
      strengths?: string[];
      weaknesses?: string[];
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    approvalStatus?: string;
    isActive?: boolean;
    placementAssessment?: {
      completed: boolean;
      score?: number;
      recommendedLevel?: 'beginner' | 'intermediate' | 'advanced';
      completedAt?: Date;
      strengths?: string[];
      weaknesses?: string[];
    };
  }
}
