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

export const AppDataSource = new DataSource({
  type: "postgres",
  host:
    process.env.DB_HOST || "pg-2a2ac9b9-ibrakhalilo22-4c7b.f.aivencloud.com",
  port: Number(process.env.DB_PORT) || 12183,
  username: process.env.DB_USERNAME || "avnadmin",
  password: process.env.DB_PASSWORD || "AVNS_0vhpVNq82FydIBgv2ow",
  database: process.env.DB_NAME || "course-service-db",
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
  ],
  synchronize: true,
  cache: false,
  // cache: {
  //   type: "ioredis",
  //   options: {
  //     host:
  //       process.env.REDIS_HOST ||
  //       "redis-13699.c135.eu-central-1-1.ec2.redns.redis-cloud.com", // Your Redis host
  //     port: Number(process.env.REDIS_PORT) || 13699, // Your Redis port
  //     password:
  //       process.env.REDIS_PASSWORD || "ttpcXXzePDYevUgWEQ7lxgNCrZWb5Oao", // Redis password if any
  //   },
  //   duration: 60000, // Cache duration in milliseconds (1 minute)
  // },
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
