import { CourseModel, RoadmapModel } from '@/database/models';
import { RecommendedTrack, TRACK_TO_CATEGORY } from '@/lib/placement-tracks';

const RECOMMENDED_COURSE_LIMIT = 6;

// Build a learner's recommended-course set and roadmap from their placement result.
// Courses are matched by difficulty level AND category track. Falls back to level-only
// if no courses have been published for the detected track yet.
export async function generateRoadmapForUser(
  userId: string,
  recommendedLevel: 'beginner' | 'intermediate' | 'advanced',
  recommendedTrack?: RecommendedTrack
) {
  const category = recommendedTrack ? TRACK_TO_CATEGORY[recommendedTrack] : undefined;

  const trackFilter = category
    ? { isPublished: true, difficulty: recommendedLevel, category }
    : { isPublished: true, difficulty: recommendedLevel };

  let matchedCourses = await CourseModel.find(trackFilter)
    .sort({ createdAt: -1 })
    .limit(RECOMMENDED_COURSE_LIMIT)
    .select('_id');

  // Fallback: if no courses exist for the specific track + level, widen to level only.
  if (matchedCourses.length === 0 && category) {
    matchedCourses = await CourseModel.find({ isPublished: true, difficulty: recommendedLevel })
      .sort({ createdAt: -1 })
      .limit(RECOMMENDED_COURSE_LIMIT)
      .select('_id');
  }

  const courseIds = matchedCourses.map((c) => c._id);

  const roadmap = await RoadmapModel.create({
    userId,
    targetLevel: recommendedLevel,
    steps: courseIds.map((courseId, index) => ({
      courseId,
      order: index + 1,
      status: 'available',
    })),
  });

  return { courseIds, roadmapId: roadmap._id };
}
