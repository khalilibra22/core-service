import express from "express";
import { SessionTimeRequestController } from "../controllers/sessionTimeRequest.controller";

const router = express.Router();

const sessionTimeRequestController = new SessionTimeRequestController();

// update complaint status
router.patch(
  "/:id/status",
  async (req, res) =>
    await sessionTimeRequestController.changeSessionTimeRequestStatus(req, res)
);

export { router as sessionTimeRequestRouter };
