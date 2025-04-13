import express from "express";
import { SessionTimeRequestController } from "../controllers/sessionTimeRequest.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { timeChangeRequestStatusSchema } from "../validations/course.validation";

const router = express.Router();

const sessionTimeRequestController = new SessionTimeRequestController();

// update complaint status
router.patch(
  "/:id/status",
  ValidationMiddleware.validate(timeChangeRequestStatusSchema),
  async (req, res) =>
    await sessionTimeRequestController.changeSessionTimeRequestStatus(req, res)
);

export { router as sessionTimeRequestRouter };
