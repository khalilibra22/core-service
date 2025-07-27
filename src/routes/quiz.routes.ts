import express from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  complaintStatusSchema,
  resolveComplaintSchema,
} from "../validations/feedback.validation";
import { AuthMiddleware } from "../utils/auth.middleware";
import { QuizController } from "../controllers/Quiz.controller";

const router = express.Router();

const quizController = new QuizController();

// create quiz
// router.post(
//   "/quizzes",
//   AuthMiddleware.verifyToken,
//   ValidationMiddleware.validate(complaintStatusSchema),
//   async (req, res) => await quizController.createQuiz(req, res)
// );

export { router as quizRouter };
