import express from "express";
import { SessionTimeRequestController } from "../../controllers/session-time-request.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { timeChangeRequestStatusSchema } from "../../validations/course.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

const router = express.Router();

const sessionTimeRequestController = new SessionTimeRequestController();

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "request_time_change"),
  ValidationMiddleware.validate(timeChangeRequestStatusSchema),
  sessionTimeRequestController.changeSessionTimeRequestStatus
);

export { router as sessionTimeRequestRouter };
