import express from "express";
import { container } from "../../container";
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

const enrollmentController = container.resolve(EnrollmentController);

router.get(
  "/teachers/:id/one-on-one-sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.getOneOnOneEnrollmentByTeacherId(req, res)
);

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  ValidationMiddleware.validate(enrollmentStatusSchema),
  (req, res) => enrollmentController.updateCourseEnrollmentStatus(req, res)
);

//create one on one enrollment
router.post(
  "/one-on-one",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(oneOnOneEnrollmentSchema),
  (req, res) => enrollmentController.createOneOnOneEnrollment(req, res)
);

router.get(
  "/student",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  (req, res) => enrollmentController.getStudentEnrollments(req, res)
);

router.get(
  "/student/courses",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  (req, res) => enrollmentController.getStudentEnrolledCourses(req, res)
);

//cancel one on one enrollment
router.post(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "cancel_enrollment"),
  ValidationMiddleware.validate(cancelEnrollmentShcema),
  (req, res) => enrollmentController.cancelOneOnOneEnrollment(req, res)
);

router.get(
  "/one-on-one/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  (req, res) => enrollmentController.getEnrollmentMaterials(req, res)
);

router.get(
  "/one-on-one/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "view"),
  (req, res) => enrollmentController.getOneOnOneEnrollmentSessions(req, res)
);

router.post(
  "/one-on-one/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.addMaterialsToOneOnOneEnrollment(req, res)
);

router.put(
  "/one-on-one/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.updateEnrollmentMaterials(req, res)
);

router.post(
  "/one-on-one/:id/sessions/:sessionId/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.addMaterialsToSession(req, res)
);

router.put(
  "/one-on-one/:id/sessions/:sessionId/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.updateSessionMaterials(req, res)
);

router.post(
  "/:id/refunds",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundValdationSchema),
  (req, res) => enrollmentController.createRefundRequest(req, res)
);

router.post(
  "/:id/refunds/:refundId/initial-response",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "respond_complaints"),
  ValidationMiddleware.validate(refundInitialResponseSchema),
  (req, res) => enrollmentController.addRefundInitialResponse(req, res)
);

router.post(
  "/:id/refunds/:refundId/student-decision",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(refundStudentDecisionSchema),
  (req, res) => enrollmentController.refundStudentDecision(req, res)
);

router.post(
  "/:id/refunds/:refundId/resolve",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "manage_all_complaints"),
  ValidationMiddleware.validate(resolveRefundSchema),
  (req, res) => enrollmentController.refundAdminResolve(req, res)
);

export { router as enrollmentRouter };
