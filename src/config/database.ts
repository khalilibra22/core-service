import { DataSource } from "typeorm";
import { CourseModel } from "../models/course.model";
import { ComplaintModel } from "../models/complaint.model";
import { CertificateModel } from "../models/certificate.model";
import { CourseSettingsModel } from "../models/course-settings.model";
import { ReviewModel } from "../models/review.model";
import { SessionModel } from "../models/session.model";
import { SessionTimeChangeRequestModel } from "../models/session-time-change-request.model";
import { SettingsModel } from "../models/settings.model";
import { QuizModel } from "../models/quiz.model";
import { AnswerModel } from "../models/answer.model";
import { QuestionModel } from "../models/question.model";
import { QuizAttemptModel } from "../models/quiz-attempt.model";
import { LessonModel } from "../models/lesson.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { MaterialModel } from "../models/material.model";
import { MaterialLinkModel } from "../models/material-link.model";
import { StudentRequestModel } from "../models/student-request.model";
import { CourseViewModel } from "../models/course-view.model";
import { CourseProgressModel } from "../models/course-progress.model";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
    MaterialModel,
    MaterialLinkModel,
    StudentRequestModel,
    CourseViewModel,
    CourseProgressModel
  ],
  synchronize: true,
  // Cache is ENABLED but only activated on specific queries (search endpoints).
  // All other queries use cache: false explicitly to avoid stale data.
  cache: {
    type: "ioredis",
    options: {
      host: process.env.REDIS_HOST || "redis-13699.c135.eu-central-1-1.ec2.redns.redis-cloud.com",
      port: Number(process.env.REDIS_PORT) || 13699,
      password: process.env.REDIS_PASSWORD || "ttpcXXzePDYevUgWEQ7lxgNCrZWb5Oao",
    },
    duration: 60000, // Fallback duration — overridden per-query
  },
});

AppDataSource.initialize()
  .then(() => {
    const { logger } = require("../utils/logger");
    logger.info("Database connected");
  })
  .catch((error) => {
    const { logger } = require("../utils/logger");
    logger.error({ err: error }, "Database connection error");
  });
