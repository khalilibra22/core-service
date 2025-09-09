import express from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  cancelEnrollmentShcema,
  enrollmentStatusSchema,
  oneOnOneEnrollmentSchema,
  refundInitialResponseSchema,
  refundValdationSchema,
  resolveRefundSchema,
  refundStudentDecisionSchema,
} from "../validations/enrollment.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const enrollmentController = new EnrollmentController();

router.get(
  "/teachers/:id/one-on-one-sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  async (req, res) =>
    await enrollmentController.getOneOnOneEnrollementByTeacherId(req, res)
);

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  ValidationMiddleware.validate(enrollmentStatusSchema),
  async (req, res) =>
    await enrollmentController.updateCourseEnrollmentStatus(req, res)
);

//create one on one enrollment
router.post(
  "/one-on-one",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(oneOnOneEnrollmentSchema),
  async (req, res) =>
    await enrollmentController.createOneOnOneErollment(req, res)
);

router.get(
  "/student",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  async (req, res) => await enrollmentController.getStudentEnrollments(req, res)
);

//cancel one on one enrollment
router.post(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "cancel_enrollment"),
  ValidationMiddleware.validate(cancelEnrollmentShcema),
  async (req, res) =>
    await enrollmentController.cancelOneOnOneEnrollment(req, res)
);

router.get(
  "/one-on-one/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  async (req, res) =>
    await enrollmentController.getOneOnOneEnrollmentSessions(req, res)
);

router.post(
  "/:id/refunds",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundValdationSchema),
  async (req, res) => await enrollmentController.createRefundRequest(req, res)
);

router.post(
  "/:id/refunds/:refundId/initial-response",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(refundInitialResponseSchema),
  async (req, res) =>
    await enrollmentController.addRefundInitialResponse(req, res)
);

router.post(
  "/:id/refunds/:refundId/student-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundStudentDecisionSchema),
  async (req, res) => await enrollmentController.refundStudentDecision(req, res)
);

router.post(
  "/:id/refunds/:refundId/resolve",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(resolveRefundSchema),
  async (req, res) => await enrollmentController.refundAdminResolve(req, res)
);

export { router as enrollmentRouter };
