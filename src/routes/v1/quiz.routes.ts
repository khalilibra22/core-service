import express from "express";
import { container } from "../../container";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { QuizController } from "../../controllers/Quiz.controller";
import {
  quizQuestionValidation,
  submitQuizAttemptValidation,
} from "../../validations/quiz.validation";

const router = express.Router();

const quizController = container.resolve(QuizController);

// create question
router.post(
  "/:id/questions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizQuestionValidation),
  (req, res) => quizController.createQuestion(req, res)
);

// update question
router.put(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizQuestionValidation),
  (req, res) => quizController.updateQuestion(req, res)
);

// delete question
router.delete(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  (req, res) => quizController.deleteQuestion(req, res)
);

// get quiz by id
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => quizController.getQuizDetails(req, res)
);

// submit quiz attempt
router.post(
  "/:id/attempts",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  ValidationMiddleware.validate(submitQuizAttemptValidation),
  (req, res) => quizController.submitQuizAttempt(req, res)
);

// get best attempt for a quiz
router.get(
  "/:id/best-attempt",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => quizController.getBestAttempt(req, res)
);

export { router as quizRouter };
