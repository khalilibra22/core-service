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
  ValidationMiddleware.validate(quizQuestionValidation),
  async (req, res) => await quizController.createQuestion(req, res)
);

// update question
router.put(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(quizQuestionValidation),
  async (req, res) => await quizController.updateQuestion(req, res)
);

// delete question
router.delete(
  "/:id/questions/:questionId",
  AuthMiddleware.verifyToken,
  async (req, res) => await quizController.deleteQuestion(req, res)
);

// get quiz by id
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  async (req, res) => await quizController.getQuizDetails(req, res)
);

export { router as quizRouter };
