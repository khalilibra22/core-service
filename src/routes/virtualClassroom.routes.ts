import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { VirtualClassroomController } from "../controllers/VirtualClassroom.controller";
import { BigBlueButtonService } from "../services/bigBlueButton.service";

const router = express.Router();

const virtualClassroomController = new VirtualClassroomController(
  new BigBlueButtonService()
);

// create a new meeting
router.post(
  "/meetings",
  AuthMiddleware.verifyToken,
  virtualClassroomController.createMeeting
);

// join a meeting
router.post(
  "/meetings/:id/join",
  AuthMiddleware.verifyToken,
  virtualClassroomController.joinMeeting
);

// end a meeting
router.patch(
  "/meetings/:id/end",
  AuthMiddleware.verifyToken,
  virtualClassroomController.endMeeting
);

// check if a meeting is running
router.get(
  "/meetings/:id/check",
  AuthMiddleware.verifyToken,
  virtualClassroomController.isMeetingRunning
);

export { router as virtualClassroomRouter };
