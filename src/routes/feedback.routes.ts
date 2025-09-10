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
  feedbackController.addComplaintInitialResponse
);

// resolve complaint
router.post(
  "/complaints/:id/resolve",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(resolveComplaintSchema),
  feedbackController.complaintAdminResolve
);

router.post(
  "/complaints/:id/student-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(studentDecisionComplaintSchema),
  feedbackController.complaintStudentDecision
);

// get all complaints
router.get(
  "/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  feedbackController.getAllComplaints
);

// get all reviews
router.get(
  "/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "manage_all_reviews"),
  feedbackController.getAllReviews
);

// get all complaints by user id
router.get(
  "/complaints/users/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "manage_reviews"),
  feedbackController.getAllComplaintsByStudentId
);

//delete complaint
router.delete(
  "/complaints/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  feedbackController.deleteComplaint
);

// get reviews of prerecorded course using pagination
router.get(
  "/reviews/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  feedbackController.getReviewsOfPrerecordedCourses
);

// get reviews by teacher id
router.get(
  "/teachers/:teacherId/reviews/courses",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  feedbackController.getReviewsByTeacherId
);

// create review for one-on-one
router.post(
  "/one-on-one/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  ValidationMiddleware.validate(reviewValdationSchema),
  feedbackController.createOneOnOneReview
);

router.get(
  "/teachers/:teacherId/reviews/one-on-one",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  feedbackController.getReviewsByOneOnOneTeacherId
);

router.get(
  "/teachers/:teacherId/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  feedbackController.getAllReviewsByTeacherId
);

router.get(
  "/teachers/:teacherId/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  feedbackController.getAllComplaintsByTeacherId
);

export { router as feedbackRouter };
