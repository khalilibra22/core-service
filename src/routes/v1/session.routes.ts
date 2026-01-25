import express from "express";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { CourseController } from "../../controllers/course.controller";
import { CourseSessionController } from "../../controllers/course-session.controller";
import { CourseMaterialController } from "../../controllers/course-material.controller";
import { QuizController } from "../../controllers/Quiz.controller";
import { quizValidation } from "../../validations/quiz.validation";
import { VirtualClassroomController } from "../../controllers/virtual-classroom.controller";
import { BigBlueButtonService } from "../../services/big-blue-button.service";
import { StreamingServiceController } from "../../controllers/streaming.controller";
import {
  lessonValidationSchema,
  timeChangeRequestValidationSchema,
  removeMaterialsSchema,
  toggleLessonMaterialShareValidationSchema,
} from "../../validations/course.validation";
import { FeedbackController } from "../../controllers/feedback.controller";
import { complaintValdationSchema } from "../../validations/feedback.validation";
import { SessionTimeRequestController } from "../../controllers/session-time-request.controller";

import { container } from "../../container";

const router = express.Router();

const courseController = container.resolve(CourseController);
const sessionController = container.resolve(CourseSessionController);
const materialController = container.resolve(CourseMaterialController);
const quizController = container.resolve(QuizController);
const virtualClassroomController = container.resolve(VirtualClassroomController);
const streamingServiceController = container.resolve(StreamingServiceController);
const feedbackController = container.resolve(FeedbackController);
const sessionTimeRequestController = container.resolve(SessionTimeRequestController);

router.post(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  (req, res) => sessionController.createLesson(req, res)
);

router.put(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(lessonValidationSchema),
  (req, res) => sessionController.updateLesson(req, res)
);

router.delete(
  "/:id/lessons/:lessonId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_materials"),
  (req, res) => sessionController.deleteLesson(req, res)
);

router.get(
  "/:id/lessons",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => sessionController.getLessonsBySessionId(req, res)
);

// Create quiz
router.post(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  (req, res) => quizController.createQuiz(req, res)
);

// Update quiz
router.put(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(quizValidation),
  (req, res) => quizController.updateQuiz(req, res)
);

// Delete quiz
router.delete(
  "/:id/quizzes/:quizId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  (req, res) => quizController.deleteQuiz(req, res)
);

// Get course quizzes
router.get(
  "/:id/quizzes",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => quizController.getSessionQuizzes(req, res)
);

// Get session details with lessons and quizzes
router.get(
  "/:id/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => sessionController.getPrerecordedSessionDetails(req, res)
);

//create a complaint
router.post(
  "/:id/complaints",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("complaints", "complain"),
  ValidationMiddleware.validate(complaintValdationSchema),
  (req, res) => feedbackController.createComplaint(req, res)
);

router.post(
  "/:id/session-time-requests",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "request_time_change"),
  ValidationMiddleware.validate(timeChangeRequestValidationSchema),
  (req, res) => sessionTimeRequestController.createSessionTimeRequest(req, res)
);

router.get(
  "/teachers/:teacherId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  (req, res) => sessionController.getOneOnOneSessionsByTeacherId(req, res)
);

router.get(
  "/:id/meeting/launch",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "launch_meeting"),
  (req, res) => virtualClassroomController.launchMeeting(req, res)
);

router.get(
  "/:id/meeting/join",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "join_meeting"),
  (req, res) => virtualClassroomController.joinMeeting(req, res)
);

router.get(
  "/:id/meeting/end",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "end_meeting"),
  (req, res) => virtualClassroomController.endMeeting(req, res)
);

// check if a meeting is running
router.get(
  "/:id/meeting/check",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "join_meeting"),
  (req, res) => virtualClassroomController.isMeetingRunning(req, res)
);

router.get(
  "/:id/videos/create-entry",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "upload_streaming_materials"),
  (req, res) => streamingServiceController.createVideoEntry(req, res)
);

router.get(
  "/:id/videos/:videoId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "watch_stream"),
  (req, res) => streamingServiceController.getVideoById(req, res)
);

router.delete(
  "/:id/videos/:videoId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_streaming_materials"),
  (req, res) => streamingServiceController.deleteVideoById(req, res)
);

// get lesson materials
router.get(
  "/:id/lessons/:lessonId/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => materialController.getLessonMaterials(req, res)
);

// remove lesson materials
router.delete(
  "/:id/lessons/:lessonId/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_materials"),
  ValidationMiddleware.validate(removeMaterialsSchema),
  (req, res) => materialController.removeLessonMaterials(req, res)
);

// toggle share/unshare all lesson materials
router.patch(
  "/:id/lessons/:lessonId/materials/share",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(toggleLessonMaterialShareValidationSchema),
  (req, res) => materialController.toggleLessonMaterialsShare(req, res)
);

// toggle share/unshare one lesson material
router.patch(
  "/:id/lessons/:lessonId/materials/:materialId/share",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  (req, res) => materialController.toggleLessonMaterialShare(req, res)
);

export { router as sessionRouter };
