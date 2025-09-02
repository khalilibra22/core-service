import { DataSource } from "typeorm";
import { CourseModel } from "../models/course.model";
import { ComplaintModel } from "../models/complaint.model";
import { CertificateModel } from "../models/certificate.model";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { ReviewModel } from "../models/review.model";
import { SessionModel } from "../models/session.model";
import { SessionTimeChangeRequestModel } from "../models/sessionTimeChangeRequest.model";
import { SettingsModel } from "../models/settings.model";
import { QuizModel } from "../models/quiz.model";
import { AnswerModel } from "../models/answer.model";
import { QuestionModel } from "../models/question.model";
import { QuizAttemptModel } from "../models/quizAttempt.model";
import { LessonModel } from "../models/lesson.model";
import { EnrollmentModel } from "../models/enrollment.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "pg-2a2ac9b9-ibrakhalilo22-4c7b.f.aivencloud.com",
  port: 12183,
  username: "avnadmin",
  password: "AVNS_0vhpVNq82FydIBgv2ow",
  database: "course-service-db",
  ssl: { rejectUnauthorized: false },
  entities: [
    CourseModel,
    ComplaintModel,
    CertificateModel,
    CourseSettingsModel,
    ReviewModel,
    SessionModel,
    SessionTimeChangeRequestModel,
    SettingsModel,
    QuizModel,
    QuizAttemptModel,
    QuestionModel,
    AnswerModel,
    LessonModel,
    EnrollmentModel,
  ],
  synchronize: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.error("Database connection error", error);
  });
