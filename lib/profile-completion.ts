import { IUser } from '@/database/models/User';

interface ProfileCompletionInput {
  name?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  education?: IUser['education'];
  careerGoals?: string;
}

const WEIGHTED_FIELDS: Array<{
  key: keyof ProfileCompletionInput;
  weight: number;
  isFilled: (value: unknown) => boolean;
}> = [
  { key: 'name', weight: 15, isFilled: (v) => typeof v === 'string' && v.trim().length > 0 },
  { key: 'phone', weight: 10, isFilled: (v) => typeof v === 'string' && v.trim().length > 0 },
  { key: 'avatar', weight: 15, isFilled: (v) => typeof v === 'string' && v.trim().length > 0 },
  { key: 'bio', weight: 15, isFilled: (v) => typeof v === 'string' && v.trim().length > 0 },
  { key: 'skills', weight: 15, isFilled: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'interests', weight: 10, isFilled: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'education', weight: 10, isFilled: (v) => Array.isArray(v) && v.length > 0 },
  { key: 'careerGoals', weight: 10, isFilled: (v) => typeof v === 'string' && v.trim().length > 0 },
];

export function computeProfileCompletion(user: ProfileCompletionInput): number {
  const totalWeight = WEIGHTED_FIELDS.reduce((sum, field) => sum + field.weight, 0);
  const earnedWeight = WEIGHTED_FIELDS.reduce(
    (sum, field) => sum + (field.isFilled(user[field.key]) ? field.weight : 0),
    0
  );

  return Math.round((earnedWeight / totalWeight) * 100);
}
