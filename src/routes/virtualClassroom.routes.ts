import express from "express";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { VirtualClassroomController } from "../controllers/VirtualClassroom.controller";
import { BigBlueButtonService } from "../services/bigBlueButton.service";
import {
  endMeetingValidationSchema,
  joinMeetingValidationSchema,
  meetingValidationSchema,
} from "../validations/virtualClassroom.validation";

const router = express.Router();

const virtualClassroomController = new VirtualClassroomController(
  new BigBlueButtonService()
);

// create a new meeting
router.post(
  "/meetings",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(meetingValidationSchema),
  virtualClassroomController.launchMeeting
);

// join a meeting
router.post(
  "/meetings/:id/join",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(joinMeetingValidationSchema),
  virtualClassroomController.joinMeeting
);

// end a meeting
router.patch(
  "/meetings/:id/end",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(endMeetingValidationSchema),
  virtualClassroomController.endMeeting
);

// check if a meeting is running
router.get(
  "/meetings/:id/check",
  AuthMiddleware.verifyToken,
  virtualClassroomController.isMeetingRunning
);

export { router as virtualClassroomRouter };
