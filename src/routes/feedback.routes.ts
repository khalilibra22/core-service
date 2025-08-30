import express from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  complaintStatusSchema,
  resolveComplaintSchema,
  reviewValdationSchema,
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

// get reviews of prerecorded course using pagination
router.get(
  "/reviews/prerecorded",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await feedbackController.getReviewsOfPrerecordedCourses(req, res)
);

// get reviews by teacher id
router.get(
  "/teachers/:teacherId/reviews/courses",
  AuthMiddleware.verifyToken,
  async (req, res) => await feedbackController.getReviewsByTeacherId(req, res)
);

// create review for one-on-one
router.post(
  "one-on-one/reviews",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(reviewValdationSchema),
  async (req, res) => await feedbackController.createOneOnOneReview(req, res)
);

router.get(
  "/teachers/:teacherId/reviews/one-on-one",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await feedbackController.getReviewsByOneOnOneTeacherId(req, res)
);

router.get(
  "/teachers/:teacherId/reviews",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await feedbackController.getAllReviewsByTeacherId(req, res)
);

export { router as feedbackRouter };
