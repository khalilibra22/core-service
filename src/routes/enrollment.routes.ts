import express from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  enrollmentStatusSchema,
  oneOnOneEnrollmentSchema,
} from "../validations/enrollment.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const enrollmentController = new EnrollmentController();

router.get(
  "/teachers/:id/one-on-one-sessions",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await enrollmentController.getOneOnOneEnrollementByTeacherId(req, res)
);

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(enrollmentStatusSchema),
  async (req, res) =>
    await enrollmentController.updateCourseEnrollmentStatus(req, res)
);

//create one on one enrollment
router.post(
  "/one-on-one",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(oneOnOneEnrollmentSchema),
  async (req, res) =>
    await enrollmentController.createOneOnOneErollment(req, res)
);

router.get(
  "/students",
  AuthMiddleware.verifyToken,
  async (req, res) => await enrollmentController.getStudentEnrollments(req, res)
);

//cancel one on one enrollment
router.patch(
  "/one-on-one/:id/cancel",
  AuthMiddleware.verifyToken,
  async (req, res) =>
    await enrollmentController.cancelOneOnOneEnrollment(req, res)
);
export { router as enrollmentRouter };
