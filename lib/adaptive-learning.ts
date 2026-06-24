import connectDB from '@/database/connection';
import { ProgressModel, ModuleModel, CourseModel, RecommendationModel, UserModel } from '@/database/models';

export interface LearningRecommendation {
  moduleId: string;
  reasoning: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface StudentPerformance {
  userId: string;
  averageScore: number;
  completionRate: number;
  learningSpeed: number;
  strengths: string[];
  weaknesses: string[];
  preferredDifficulty: string;
}

export class AdaptiveLearningEngine {
  static async analyzeStudentPerformance(userId: string): Promise<StudentPerformance> {
    await connectDB();
    
    const progress = await ProgressModel.find({ userId })
      .populate('moduleId', 'difficulty type')
      .populate('courseId', 'title category');
    
    if (progress.length === 0) {
      return {
        userId,
        averageScore: 0,
        completionRate: 0,
        learningSpeed: 1,
        strengths: [],
        weaknesses: [],
        preferredDifficulty: 'beginner',
      };
    }
    
    const completedModules = progress.filter(p => p.status === 'completed');
    const averageScore = completedModules.reduce((sum, p) => sum + (p.score || 0), 0) / completedModules.length;
    const completionRate = (completedModules.length / progress.length) * 100;
    
    // Calculate learning speed based on time spent vs module difficulty
    const learningSpeed = this.calculateLearningSpeed(progress);
    
    // Analyze strengths and weaknesses by category and difficulty
    const performanceByCategory = this.analyzePerformanceByCategory(progress);
    
    return {
      userId,
      averageScore,
      completionRate,
      learningSpeed,
      strengths: performanceByCategory.strengths,
      weaknesses: performanceByCategory.weaknesses,
      preferredDifficulty: this.determinePreferredDifficulty(progress),
    };
  }
  
  static async generateRecommendations(userId: string): Promise<LearningRecommendation[]> {
    await connectDB();

    const performance = await this.analyzeStudentPerformance(userId);
    const currentProgress = await ProgressModel.find({ userId });
    const completedModuleIds = currentProgress
      .filter(p => p.status === 'completed')
      .map(p => p.moduleId.toString());
    const profile = await UserModel.findById(userId).select('skills interests careerGoals');

    // Get available modules that the user hasn't completed
    const availableModules = await ModuleModel.find({
      _id: { $nin: completedModuleIds },
      isPublished: true,
    }).populate('courseId', 'title category');

    const recommendations: LearningRecommendation[] = [];

    for (const module of availableModules) {
      const recommendation = await this.evaluateModule(module, performance, currentProgress, profile);
      if (recommendation.confidence > 0.3) {
        recommendations.push(recommendation);
      }
    }
    
    // Sort by confidence and priority
    return recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] * b.confidence) - (priorityWeight[a.priority] * a.confidence);
    });
  }
  
  private static async evaluateModule(
    module: any,
    performance: StudentPerformance,
    currentProgress: any[],
    profile?: { skills?: string[]; interests?: string[]; careerGoals?: string } | null
  ): Promise<LearningRecommendation> {
    let confidence = 0;
    let reasoning = '';
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Check if module matches user's preferred difficulty
    if (module.difficulty === performance.preferredDifficulty) {
      confidence += 0.3;
      reasoning += `Matches your preferred difficulty level (${module.difficulty}). `;
    }
    
    // Check if user has completed prerequisites
    const courseModules = await ModuleModel.find({ courseId: module.courseId._id }).sort({ order: 1 });
    const currentModuleIndex = courseModules.findIndex(m => m._id.toString() === module._id.toString());
    const prerequisites = courseModules.slice(0, currentModuleIndex);
    
    const completedPrerequisites = prerequisites.filter(prereq => 
      currentProgress.some(p => p.moduleId.toString() === prereq._id.toString() && p.status === 'completed')
    );
    
    if (prerequisites.length > 0) {
      const prerequisiteCompletionRate = completedPrerequisites.length / prerequisites.length;
      confidence += prerequisiteCompletionRate * 0.4;
      
      if (prerequisiteCompletionRate >= 0.8) {
        reasoning += `You've completed most prerequisites. `;
        priority = 'high';
      } else if (prerequisiteCompletionRate >= 0.5) {
        reasoning += `You've completed some prerequisites. `;
        priority = 'medium';
      } else {
        reasoning += `Consider completing prerequisites first. `;
        priority = 'low';
      }
    }
    
    // Check if module addresses user's weaknesses
    if (performance.weaknesses.includes(module.courseId.category)) {
      confidence += 0.2;
      reasoning += `This will help improve your ${module.courseId.category} skills. `;
      priority = priority === 'high' ? 'high' : 'medium';
    }
    
    // Check if module builds on user's strengths
    if (performance.strengths.includes(module.courseId.category)) {
      confidence += 0.1;
      reasoning += `Builds on your strengths in ${module.courseId.category}. `;
    }
    
    // Boost confidence when the module aligns with the learner's stated career goals or interests
    const category = (module.courseId.category || '').toLowerCase();
    const title = (module.courseId.title || '').toLowerCase();
    const careerGoals = (profile?.careerGoals || '').toLowerCase();
    const interests = (profile?.interests || []).map(i => i.toLowerCase());

    if (category && careerGoals && careerGoals.includes(category)) {
      confidence += 0.15;
      reasoning += `Directly supports your stated career goal. `;
      priority = 'high';
    } else if (interests.some(interest => category.includes(interest) || title.includes(interest))) {
      confidence += 0.1;
      reasoning += `Matches one of your listed interests. `;
    }

    // Adjust confidence based on user's performance
    if (performance.averageScore > 80) {
      confidence += 0.1;
    } else if (performance.averageScore < 60 && module.difficulty !== 'beginner') {
      confidence -= 0.2;
      reasoning += `Consider starting with beginner modules. `;
    }
    
    return {
      moduleId: module._id.toString(),
      reasoning: reasoning || 'Recommended based on your learning progress.',
      priority,
      confidence: Math.max(0, Math.min(1, confidence)),
    };
  }
  
  private static calculateLearningSpeed(progress: any[]): number {
    const completedModules = progress.filter(p => p.status === 'completed' && p.timeSpent > 0);
    
    if (completedModules.length === 0) return 1;
    
    const avgTimePerModule = completedModules.reduce((sum, p) => sum + p.timeSpent, 0) / completedModules.length;
    
    // Normalize to a scale where 1.0 is average speed
    // Assuming average time per module is 60 minutes
    return 60 / Math.max(avgTimePerModule, 10);
  }
  
  private static analyzePerformanceByCategory(progress: any[]): { strengths: string[]; weaknesses: string[] } {
    const categoryPerformance: { [key: string]: { scores: number[]; completed: number } } = {};
    
    progress.forEach(p => {
      const category = p.courseId.category;
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { scores: [], completed: 0 };
      }
      
      if (p.status === 'completed' && p.score) {
        categoryPerformance[category].scores.push(p.score);
        categoryPerformance[category].completed++;
      }
    });
    
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    Object.entries(categoryPerformance).forEach(([category, data]) => {
      if (data.scores.length > 0) {
        const avgScore = data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length;
        
        if (avgScore >= 80) {
          strengths.push(category);
        } else if (avgScore < 60) {
          weaknesses.push(category);
        }
      }
    });
    
    return { strengths, weaknesses };
  }
  
  private static determinePreferredDifficulty(progress: any[]): string {
    const completedModules = progress.filter(p => p.status === 'completed');
    
    if (completedModules.length === 0) return 'beginner';
    
    const difficultyScores: { [key: string]: number[] } = {
      beginner: [],
      intermediate: [],
      advanced: [],
    };
    
    completedModules.forEach(p => {
      const difficulty = p.moduleId.difficulty;
      if (difficultyScores[difficulty] && p.score) {
        difficultyScores[difficulty].push(p.score);
      }
    });
    
    // Find the highest difficulty where the user performs well (>= 75% average)
    if (difficultyScores.advanced.length > 0) {
      const avgScore = difficultyScores.advanced.reduce((sum, score) => sum + score, 0) / difficultyScores.advanced.length;
      if (avgScore >= 75) return 'advanced';
    }
    
    if (difficultyScores.intermediate.length > 0) {
      const avgScore = difficultyScores.intermediate.reduce((sum, score) => sum + score, 0) / difficultyScores.intermediate.length;
      if (avgScore >= 75) return 'intermediate';
    }
    
    return 'beginner';
  }
  
  static async saveRecommendations(userId: string, recommendations: LearningRecommendation[]): Promise<void> {
    await connectDB();
    
    // Clear existing recommendations for this user
    await RecommendationModel.deleteMany({ userId });
    
    // Create new recommendations
    const recommendationDocs = recommendations.map(rec => ({
      userId,
      suggestedModules: [rec.moduleId],
      reasoning: rec.reasoning,
      priority: rec.priority,
    }));
    
    await RecommendationModel.insertMany(recommendationDocs);
  }
}
