import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { QuizController } from "../controllers/Quiz.controller";
import { quizQuestionValidation } from "../validations/quiz.validation";

const router = express.Router();

const quizController = new QuizController();

// create question
router.post(
  "/:id/questions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizQuestionValidation),
  quizController.createQuestion
);

// update question
router.put(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizQuestionValidation),
  quizController.updateQuestion
);

// delete question
router.delete(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  quizController.deleteQuestion
);

// get quiz by id
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  quizController.getQuizDetails
);

export { router as quizRouter };
