import express from "express";
import { SessionTimeRequestController } from "../controllers/sessionTimeRequest.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { timeChangeRequestStatusSchema } from "../validations/course.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const sessionTimeRequestController = new SessionTimeRequestController();

router.patch(
  "/:id/status",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(timeChangeRequestStatusSchema),
  async (req, res) =>
    await sessionTimeRequestController.changeSessionTimeRequestStatus(req, res)
);

export { router as sessionTimeRequestRouter };
