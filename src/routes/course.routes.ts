import express from "express";
import { CourseController } from "../controllers/course.controller";
import { FeedbackController } from "../controllers/feedback.controller";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { SessionTimeRequestController } from "../controllers/sessionTimeRequest.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  certificateValidationSchema,
  courseCancellationValidationSchema,
  courseValidationSchema,
  createCourseValidationSchema,
  sessionValidationSchema,
  timeChangeRequestValidationSchema,
} from "../validations/course.validation";
import {
  complaintValdationSchema,
  reviewValdationSchema,
} from "../validations/feedback.validation";
import { enrollmentValidationsSchema } from "../validations/enrollment.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const courseController = new CourseController();
const feedbackController = new FeedbackController();
const enrollmentController = new EnrollmentController();
const sessionTimeRequestController = new SessionTimeRequestController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(createCourseValidationSchema),
  async (req, res) => await courseController.createDraftCourse(req, res)
);

//update course
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(courseValidationSchema),
  async (req, res) => await courseController.updateCourse(req, res)
);

router.put(
  "/:id/draft",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(courseValidationSchema),
  async (req, res) => await courseController.updateDraftCourse(req, res)
);

//delete course
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.deleteCourse(req, res)
);

// get course by id
router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getCourseById(req, res)
);

router.post(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(sessionValidationSchema),
  async (req, res) => await courseController.createCourseSession(req, res)
);

//update session
router.put(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(sessionValidationSchema),
  async (req, res) => await courseController.updateCourseSession(req, res)
);

// delete session
router.delete(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.deleteCourseSession(req, res)
);

//create a review
router.post(
  "/:id/reviews",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(reviewValdationSchema),
  async (req, res) => await feedbackController.createReview(req, res)
);

//create a complaint
router.post(
  "/:id/sessions/:sessionId/complaints/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(complaintValdationSchema),
  async (req, res) => await feedbackController.createComplaint(req, res)
);

//create a certificate
router.post(
  "/:id/certificates",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(certificateValidationSchema),
  async (req, res) => await courseController.createCertificate(req, res)
);

// Create course enrollment
router.post(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(enrollmentValidationsSchema),
  async (req, res) => await enrollmentController.createEnrollment(req, res)
);

// Get all course sessions
router.get(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getCourseSessions(req, res)
);

//cancel course
router.patch(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(courseCancellationValidationSchema),
  async (req, res) => await courseController.cancelCourse(req, res)
);

router.post(
  "/:id/sessions/:sessionId/session-time-requests/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(timeChangeRequestValidationSchema),
  async (req, res) =>
    await sessionTimeRequestController.createSessionTimeRequest(req, res)
);

router.get(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  async (req, res) => await enrollmentController.getCourseEnrollments(req, res)
);

router.get("/teachers/:id", AuthMiddleware.verifyToken, async (req, res) => {
  const id = req.params.id;
  await courseController.getCoursesByTeacherId(req, res);
});

// get all live courses
router.get(
  "/live",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getAllLiveCourses(req, res)
);

router.get(
  "/group",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getAllGroupCourses(req, res)
);

// get all prerecorded courses
router.get(
  "/prerecorded",
  AuthMiddleware.verifyToken,
  async (req, res) => await courseController.getAllPrerecordedCourses(req, res)
);

export { router as courseRouter };
