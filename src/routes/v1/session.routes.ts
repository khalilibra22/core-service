import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CourseController } from "../../controllers/course.controller";
import { QuizController } from "../../controllers/quiz.controller";
import { quizValidation } from "../../validations/quiz.validation";
import { VirtualClassroomController } from "../../controllers/virtual-classroom.controller";
import { BigBlueButtonService } from "../../services/big-blue-button.service";
import { StreamingServiceController } from "../../controllers/streaming.controller";
import {
  lessonValidationSchema,
  timeChangeRequestValidationSchema,
} from "../../validations/course.validation";
import { FeedbackController } from "../../controllers/feedback.controller";
import { complaintValdationSchema } from "../../validations/feedback.validation";
import { SessionTimeRequestController } from "../../controllers/session-time-request.controller";
import { endMeetingValidationSchema } from "../../validations/virtual-classroom.validation";

const router = express.Router();

const courseController = new CourseController();
const quizController = new QuizController();
const virtualClassroomController = new VirtualClassroomController(
  new BigBlueButtonService()
);
const streamingServiceController = new StreamingServiceController();
const feedbackController = new FeedbackController();
const sessionTimeRequestController = new SessionTimeRequestController();

router.post(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  courseController.createLesson
);

router.put(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  courseController.updateLesson
);

router.delete(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_materials"),
  courseController.deleteLesson
);

router.get(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  courseController.getLessonsBySessionId
);

// Create quiz
router.post(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  quizController.createQuiz
);

// Update quiz
router.put(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  quizController.updateQuiz
);

// Delete quiz
router.delete(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  quizController.deleteQuiz
);

// Get course quizzes
router.get(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  quizController.getSessionQuizzes
);

// Get session details with lessons and quizzes
router.get(
  "/:id/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  courseController.getPrerecordedSessionDetails
);

//create a complaint
router.post(
  "/:id/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(complaintValdationSchema),
  feedbackController.createComplaint
);

router.post(
  "/:id/session-time-requests",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "request_time_change"),
  ValidationMiddleware.validate(timeChangeRequestValidationSchema),
  sessionTimeRequestController.createSessionTimeRequest
);

router.get(
  "/teachers/:teacherId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  courseController.getOneOnOneSessionsByTeacherId
);

router.get(
  "/:id/launch-meeting",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "launch_meeting"),
  virtualClassroomController.launchMeeting
);

router.get(
  "/:id/join-meeting",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "join_meeting"),
  virtualClassroomController.joinMeeting
);

router.post(
  "/:id/meetings/:meetingId/end",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "end_meeting"),
  ValidationMiddleware.validate(endMeetingValidationSchema),
  virtualClassroomController.endMeeting
);

// check if a meeting is running
router.get(
  "/:id/meetings/:meetingId/check",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "join_meeting"),
  virtualClassroomController.isMeetingRunning
);

router.get(
  "/:id/videos/create-entry",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "upload_streaming_materials"),
  streamingServiceController.createVideoEntry
);

router.get(
  "/:id/videos/:videoId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "watch_stream"),
  streamingServiceController.getVideoById
);

router.delete(
  "/:id/videos/:videoId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_streaming_materials"),
  streamingServiceController.deleteVideoById
);

export { router as sessionRouter };
