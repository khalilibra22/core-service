import express from "express";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { enrollmentStatusSchema } from "../validations/enrollment.validation";

const router = express.Router();

const enrollmentController = new EnrollmentController();

router.get("/teachers/:id/one-on-one-sessions", async (req, res) => {
  await enrollmentController.getOneOnOneEnrollementByTeacherId(req, res);
});

router.patch(
  "/:id/status",
  ValidationMiddleware.validate(enrollmentStatusSchema),
  async (req, res) =>
    await enrollmentController.updateCourseEnrollmentStatus(req, res)
);

export { router as enrollmentRouter };
