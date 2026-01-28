import express from "express";
import { container } from "../../container";
import { SessionTimeRequestController } from "../../controllers/session-time-request.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { timeChangeRequestStatusSchema } from "../../validations/course.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

const router = express.Router();

const sessionTimeRequestController = container.resolve(SessionTimeRequestController);

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "request_time_change"),
  ValidationMiddleware.validate(timeChangeRequestStatusSchema),
  (req, res) => sessionTimeRequestController.changeSessionTimeRequestStatus(req, res)
);

router.get(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => sessionTimeRequestController.getSessionTimeRequests(req, res)
);

export { router as sessionTimeRequestRouter };
