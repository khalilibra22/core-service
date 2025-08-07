import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { VirtualClassroomController } from "../controllers/VirtualClassroom.controller";

const router = express.Router();

const virtualClassroomController = new VirtualClassroomController();

// create a new meeting
router.post(
  "/create-meeting",
  AuthMiddleware.verifyToken,
  virtualClassroomController.createMeeting
);

// join a meeting
router.post(
  "/join-meeting",
  AuthMiddleware.verifyToken,
  virtualClassroomController.joinMeeting
);

// end a meeting
router.patch(
  "/end-meeting/:id",
  AuthMiddleware.verifyToken,
  virtualClassroomController.endMeeting
);

// check if a meeting is running
router.get(
  "/is-meeting-running/:id",
  AuthMiddleware.verifyToken,
  virtualClassroomController.isMeetingRunning
);

export { router as virtualClassroomRouter };
