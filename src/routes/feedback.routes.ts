import express from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  complaintStatusSchema,
  resolveComplaintSchema,
} from "../validations/feedback.validation";

const router = express.Router();

const feedbackController = new FeedbackController();

// update complaint status
router.patch(
  "/complaints/:id/status",
  ValidationMiddleware.validate(complaintStatusSchema),
  async (req, res) => await feedbackController.changeComplaintStatus(req, res)
);

// resolve complaint
router.patch(
  "/complaints/:id/resolve",
  ValidationMiddleware.validate(resolveComplaintSchema),
  async (req, res) => await feedbackController.resolveComplaint(req, res)
);

// get all complaints
router.get(
  "/complaints",
  async (req, res) => await feedbackController.getAllComplaints(req, res)
);

// get all reviews
router.get(
  "/reviews",
  async (req, res) => await feedbackController.getAllReviews(req, res)
);

// get all complaints by user id
router.get(
  "/complaints/users/:id",
  async (req, res) =>
    await feedbackController.getAllComplaintsByStudentId(req, res)
);

//delete complaint
router.delete(
  "/complaints/:id",
  async (req, res) => await feedbackController.deleteComplaint(req, res)
);

export { router as feedbackRouter };
