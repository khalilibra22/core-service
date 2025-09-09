import express from "express";
import { CourseController } from "../controllers/course.controller";
import { FeedbackController } from "../controllers/feedback.controller";
import { EnrollmentController } from "../controllers/enrollment.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import {
  certificateValidationSchema,
  courseCancellationValidationSchema,
  courseValidationSchema,
  createCourseValidationSchema,
  sessionValidationSchema,
} from "../validations/course.validation";
import { reviewValdationSchema } from "../validations/feedback.validation";
import { enrollmentValidationsSchema } from "../validations/enrollment.validation";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = express.Router();

const courseController = new CourseController();
const feedbackController = new FeedbackController();
const enrollmentController = new EnrollmentController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(createCourseValidationSchema),
  async (req, res) => await courseController.createDraftCourse(req, res)
);

//update course
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseValidationSchema),
  async (req, res) => await courseController.updateCourse(req, res)
);

router.put(
  "/:id/draft",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseValidationSchema),
  async (req, res) => await courseController.updateDraftCourse(req, res)
);

//delete course
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  async (req, res) => await courseController.deleteCourse(req, res)
);

// get course by id
router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  async (req, res) => await courseController.getCourseById(req, res)
);

router.post(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  async (req, res) => await courseController.createCourseSession(req, res)
);

//update session
router.put(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  async (req, res) => await courseController.updateCourseSession(req, res)
);

// delete session
router.delete(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  async (req, res) => await courseController.deleteCourseSession(req, res)
);

//create a review
router.post(
  "/:id/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  ValidationMiddleware.validate(reviewValdationSchema),
  async (req, res) => await feedbackController.createCourseReview(req, res)
);

//get course reviews
router.get(
  "/:id/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  async (req, res) => await feedbackController.getReviewsByCourseId(req, res)
);

//create a certificate
router.post(
  "/:id/certificates",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(certificateValidationSchema),
  async (req, res) => await courseController.createCertificate(req, res)
);

// Create course enrollment
router.post(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(enrollmentValidationsSchema),
  async (req, res) => await enrollmentController.createEnrollment(req, res)
);

// Get all course sessions
router.get(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  async (req, res) => await courseController.getCourseSessions(req, res)
);

// Get all prerecorded course sections
router.get(
  "/:id/prerecorded-sections",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  async (req, res) =>
    await courseController.getPrerecordedCourseSections(req, res)
);

//cancel course
router.patch(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "cancel_course"),
  ValidationMiddleware.validate(courseCancellationValidationSchema),
  async (req, res) => await courseController.cancelCourse(req, res)
);

router.get(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  async (req, res) => await enrollmentController.getCourseEnrollments(req, res)
);

router.get(
  "/teachers/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  async (req, res) => {
    const id = req.params.id;
    await courseController.getCoursesByTeacherId(req, res);
  }
);

// get all live courses
router.get(
  "/live",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  async (req, res) => await courseController.getAllLiveCourses(req, res)
);

router.get(
  "/group",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  async (req, res) => await courseController.getAllGroupCourses(req, res)
);

// get all prerecorded courses
router.get(
  "/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  async (req, res) => await courseController.getAllPrerecordedCourses(req, res)
);

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  async (req, res) => await courseController.searchCourses(req, res)
);

export { router as courseRouter };
