import express from "express";
import { EnrollmentController } from "../../controllers/enrollment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  cancelEnrollmentShcema,
  enrollmentStatusSchema,
  oneOnOneEnrollmentSchema,
  refundInitialResponseSchema,
  refundValdationSchema,
  resolveRefundSchema,
  refundStudentDecisionSchema,
} from "../../validations/enrollment.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

const router = express.Router();

const enrollmentController = new EnrollmentController();

router.get(
  "/teachers/:id/one-on-one-sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  enrollmentController.getOneOnOneEnrollementByTeacherId
);

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  ValidationMiddleware.validate(enrollmentStatusSchema),
  enrollmentController.updateCourseEnrollmentStatus
);

//create one on one enrollment
router.post(
  "/one-on-one",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(oneOnOneEnrollmentSchema),
  enrollmentController.createOneOnOneErollment
);

router.get(
  "/student",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  enrollmentController.getStudentEnrollments
);

router.get(
  "/student/courses",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  enrollmentController.getStudentEnrolledCourses
);

//cancel one on one enrollment
router.post(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "cancel_enrollment"),
  ValidationMiddleware.validate(cancelEnrollmentShcema),
  enrollmentController.cancelOneOnOneEnrollment
);

router.get(
  "/one-on-one/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  enrollmentController.getOneOnOneEnrollmentSessions
);

router.post(
  "/:id/refunds",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundValdationSchema),
  enrollmentController.createRefundRequest
);

router.post(
  "/:id/refunds/:refundId/initial-response",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(refundInitialResponseSchema),
  enrollmentController.addRefundInitialResponse
);

router.post(
  "/:id/refunds/:refundId/student-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundStudentDecisionSchema),
  enrollmentController.refundStudentDecision
);

router.post(
  "/:id/refunds/:refundId/resolve",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(resolveRefundSchema),
  enrollmentController.refundAdminResolve
);

export { router as enrollmentRouter };
