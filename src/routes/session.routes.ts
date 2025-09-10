import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { CourseController } from "../controllers/course.controller";
import { QuizController } from "../controllers/Quiz.controller";
import { quizValidation } from "../validations/quiz.validation";
import {
  lessonValidationSchema,
  timeChangeRequestValidationSchema,
} from "../validations/course.validation";
import { FeedbackController } from "../controllers/feedback.controller";
import { complaintValdationSchema } from "../validations/feedback.validation";
import { SessionTimeRequestController } from "../controllers/sessionTimeRequest.controller";

const router = express.Router();

const courseController = new CourseController();
const quizController = new QuizController();
const feedbackController = new FeedbackController();
const sessionTimeRequestController = new SessionTimeRequestController();

router.post(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  async (req, res) => await courseController.createLesson(req, res)
);

router.put(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  async (req, res) => await courseController.updateLesson(req, res)
);

router.delete(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  async (req, res) => await courseController.deleteLesson(req, res)
);

router.get(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  async (req, res) => await courseController.getLessonsBySessionId(req, res)
);

// Create quiz
router.post(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  async (req, res) => await quizController.createQuiz(req, res)
);

// Update quiz
router.put(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  async (req, res) => await quizController.updateQuiz(req, res)
);

// Delete quiz
router.delete(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  quizController.deleteQuiz
);

// Get course quizzes
router.get(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  quizController.getSessionQuizzes
);

// Get session details with lessons and quizzes
router.get(
  "/:id/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  courseController.getPrerecordedSessionDetails
);

//create a complaint
router.post(
  "/:id/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(complaintValdationSchema),
  feedbackController.createComplaint
);

router.post(
  "/:id/session-time-requests",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "request_time_change"),
  ValidationMiddleware.validate(timeChangeRequestValidationSchema),
  sessionTimeRequestController.createSessionTimeRequest
);

router.get(
  "/teachers/:teacherId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  courseController.getOneOnOneSessionsByTeacherId
);

export { router as sessionRouter };
