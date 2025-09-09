import express from "express";
import { FeedbackController } from "../controllers/feedback.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  complaintInitialResponseSchema,
  resolveComplaintSchema,
  reviewValdationSchema,
  studentDecisionComplaintSchema,
} from "../validations/feedback.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const feedbackController = new FeedbackController();

router.post(
  "/complaints/:id/initial-response",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(complaintInitialResponseSchema),
  async (req, res) =>
    await feedbackController.addComplaintInitialResponse(req, res)
);

// resolve complaint
router.post(
  "/complaints/:id/resolve",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(resolveComplaintSchema),
  async (req, res) => await feedbackController.complaintAdminResolve(req, res)
);

router.post(
  "/complaints/:id/student-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(studentDecisionComplaintSchema),
  async (req, res) =>
    await feedbackController.complaintStudentDecision(req, res)
);

// get all complaints
router.get(
  "/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  async (req, res) => await feedbackController.getAllComplaints(req, res)
);

// get all reviews
router.get(
  "/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "manage_all_reviews"),
  async (req, res) => await feedbackController.getAllReviews(req, res)
);

// get all complaints by user id
router.get(
  "/complaints/users/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "manage_reviews"),

  async (req, res) =>
    await feedbackController.getAllComplaintsByStudentId(req, res)
);

//delete complaint
router.delete(
  "/complaints/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  async (req, res) => await feedbackController.deleteComplaint(req, res)
);

// get reviews of prerecorded course using pagination
router.get(
  "/reviews/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  async (req, res) =>
    await feedbackController.getReviewsOfPrerecordedCourses(req, res)
);

// get reviews by teacher id
router.get(
  "/teachers/:teacherId/reviews/courses",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  async (req, res) => await feedbackController.getReviewsByTeacherId(req, res)
);

// create review for one-on-one
router.post(
  "/one-on-one/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  ValidationMiddleware.validate(reviewValdationSchema),
  async (req, res) => await feedbackController.createOneOnOneReview(req, res)
);

router.get(
  "/teachers/:teacherId/reviews/one-on-one",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  async (req, res) =>
    await feedbackController.getReviewsByOneOnOneTeacherId(req, res)
);

router.get(
  "/teachers/:teacherId/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  async (req, res) =>
    await feedbackController.getAllReviewsByTeacherId(req, res)
);

router.get(
  "/teachers/:teacherId/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  async (req, res) =>
    await feedbackController.getAllComplaintsByTeacherId(req, res)
);

export { router as feedbackRouter };
