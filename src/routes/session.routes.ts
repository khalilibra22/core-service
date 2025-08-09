import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { CourseController } from "../controllers/course.controller";
import { QuizController } from "../controllers/Quiz.controller";
import { quizValidation } from "../validations/quiz.validation";
import { lessonValidationSchema } from "../validations/course.validation";
import { VirtualClassroomController } from "../controllers/VirtualClassroom.controller";
import { BigBlueButtonService } from "../services/bigBlueButton.service";

const router = express.Router();

const courseController = new CourseController();
const quizController = new QuizController();
const virtualClassroomController = new VirtualClassroomController(
  new BigBlueButtonService()
);

router.post(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(lessonValidationSchema),
  async (req, res) => await courseController.createLesson(req, res)
);

router.put(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(lessonValidationSchema),
  async (req, res) => await courseController.updateLesson(req, res)
);

router.delete(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.deleteLesson(req, res)
);

router.get(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getLessonsBySessionId(req, res)
);

// Create quiz
router.post(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(quizValidation),
  async (req, res) => await quizController.createQuiz(req, res)
);

// Update quiz
router.put(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(quizValidation),
  async (req, res) => await quizController.updateQuiz(req, res)
);

// Delete quiz
router.delete(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  async (req, res) => await quizController.deleteQuiz(req, res)
);

// Get course quizzes
router.get(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  async (req, res) => await quizController.getSessionQuizzes(req, res)
);

// Get session details with lessons and quizzes
router.get(
  "/:id/prerecorded",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await courseController.getPrerecordedSessionDetails(req, res)
);

router.get(
  "/:id/launch-meeting",
  AuthMiddleware.verifyToken,
  virtualClassroomController.launchMeeting
);

router.get(
  "/:id/join-meeting",
  AuthMiddleware.verifyToken,
  virtualClassroomController.joinMeeting
);

export { router as sessionRouter };
