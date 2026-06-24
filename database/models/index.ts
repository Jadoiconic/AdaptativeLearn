import UserModel from './User';
import CourseModel from './Course';
import ModuleModel from './Module';
import ProgressModel from './Progress';
import RecommendationModel from './Recommendation';
import AssessmentModel from './Assessment';
import ActivityModel from './Activity';
import CertificateModel from './Certificate';
import QuizModel from './Quiz';
import QuizResultModel from './QuizResult';

export {
  UserModel,
  CourseModel,
  ModuleModel,
  ProgressModel,
  RecommendationModel,
  AssessmentModel,
  ActivityModel,
  CertificateModel,
  QuizModel,
  QuizResultModel,
};

export default {
  User: UserModel,
  Course: CourseModel,
  Module: ModuleModel,
  Progress: ProgressModel,
  Recommendation: RecommendationModel,
  Assessment: AssessmentModel,
  Activity: ActivityModel,
  Certificate: CertificateModel,
  Quiz: QuizModel,
  QuizResult: QuizResultModel,
};
