import express from "express";
import { FeedbackController } from "../../controllers/feedback.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  tutorReplySchema,
  complaintValdationSchema,
  issueValidationSchema,
  resolveComplaintSchema,
  reviewValdationSchema,
  studentDecisionComplaintSchema,
  adminDecisionSchema,
} from "../../validations/feedback.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

import { container } from "../../container";

const router = express.Router();

const feedbackController = container.resolve(FeedbackController);

router.post(
  "/complaints/:id/respond",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(tutorReplySchema),
  feedbackController.respondToComplaint
);

router.post(
  "/complaints/:id/initial-response",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(tutorReplySchema),
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


// Issue / Complaint endpoints
router.get(
  "/complaints",
  AuthMiddleware.verifyToken,
  feedbackController.listComplaints
);

router.post(
  "/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(issueValidationSchema),
  feedbackController.createComplaint
);

// Tutor endpoints
router.get(
  "/complaints/tutor/stats",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  feedbackController.getTutorIssueStats
);

router.get(
  "/complaints/tutor",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  feedbackController.listComplaints // Already handles tutor role via query/body
);
router.post(
  "/complaints/:id/tutor-reply",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(tutorReplySchema),
  feedbackController.respondToComplaint
);

// Learner endpoints
router.post(
  "/complaints/:id/learner-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(studentDecisionComplaintSchema),
  feedbackController.learnerDecision
);

// Admin Dispute Center
router.get(
  "/complaints/admin/stats",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  feedbackController.getAdminDisputeStats
);

router.get(
  "/complaints/admin/disputes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  feedbackController.getAllComplaints // Or specialized admin list
);

router.post(
  "/complaints/admin/disputes/:id/decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(adminDecisionSchema),
  feedbackController.adminDecision
);

// get complaint detail (new Specification)
router.get(
  "/complaints/:id",
  AuthMiddleware.verifyToken,
  feedbackController.getComplaintDetail
);

// get all complaints (old route - might be used by admin panel)
router.get(
  "/complaints/all",
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
