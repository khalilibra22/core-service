import express from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  complaintStatusSchema,
  resolveComplaintSchema,
} from "../validations/feedback.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const feedbackController = new FeedbackController();

// update complaint status
router.patch(
  "/complaints/:id/status",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(complaintStatusSchema),
  async (req, res) => await feedbackController.changeComplaintStatus(req, res)
);

// resolve complaint
router.patch(
  "/complaints/:id/resolve",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(resolveComplaintSchema),
  async (req, res) => await feedbackController.resolveComplaint(req, res)
);

// get all complaints
router.get(
  "/complaints",
  AuthMiddleware.verifyToken,
  async (req, res) => await feedbackController.getAllComplaints(req, res)
);

// get all reviews
router.get(
  "/reviews",
  AuthMiddleware.verifyToken,
  async (req, res) => await feedbackController.getAllReviews(req, res)
);

// get all complaints by user id
router.get(
  "/complaints/users/:id",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await feedbackController.getAllComplaintsByStudentId(req, res)
);

//delete complaint
router.delete(
  "/complaints/:id",
  AuthMiddleware.verifyToken,
  async (req, res) => await feedbackController.deleteComplaint(req, res)
);

export { router as feedbackRouter };
