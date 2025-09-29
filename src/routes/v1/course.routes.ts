import express from "express";
import { CourseController } from "../../controllers/course.controller";
import { FeedbackController } from "../../controllers/feedback.controller";
import { EnrollmentController } from "../../controllers/enrollment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  certificateValidationSchema,
  courseCancellationValidationSchema,
  courseMaterialsSchema,
  courseValidationSchema,
  createCourseValidationSchema,
  sessionValidationSchema,
} from "../../validations/course.validation";
import { reviewValdationSchema } from "../../validations/feedback.validation";
import { enrollmentValidationsSchema } from "../../validations/enrollment.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

const router = express.Router();

const courseController = new CourseController();
const feedbackController = new FeedbackController();
const enrollmentController = new EnrollmentController();

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(createCourseValidationSchema),
  courseController.createDraftCourse
);

//update course
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseValidationSchema),
  courseController.updateCourse
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
  courseController.deleteCourse
);

// get course by id
router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  courseController.getCourseById
);

router.post(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  courseController.createCourseSession
);

//update session
router.put(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  courseController.updateCourseSession
);

// delete session
router.delete(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  courseController.deleteCourseSession
);

//create a review
router.post(
  "/:id/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  ValidationMiddleware.validate(reviewValdationSchema),
  feedbackController.createCourseReview
);

//get course reviews
router.get(
  "/:id/reviews",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "view"),
  feedbackController.getReviewsByCourseId
);

//create a certificate
router.post(
  "/:id/certificates",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(certificateValidationSchema),
  courseController.createCertificate
);

// Create course enrollment
router.post(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(enrollmentValidationsSchema),
  enrollmentController.createEnrollment
);

// get course by id
router.patch(
  "/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseMaterialsSchema),
  courseController.addCourseMaterials
);

// Get all course sessions
router.get(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  courseController.getCourseSessions
);

// Get all prerecorded course sections
router.get(
  "/:id/prerecorded-sections",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  courseController.getPrerecordedCourseSections
);

//cancel course
router.patch(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "cancel_course"),
  ValidationMiddleware.validate(courseCancellationValidationSchema),
  courseController.cancelCourse
);

router.get(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  enrollmentController.getCourseEnrollments
);

router.get(
  "/teachers/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  courseController.getCoursesByTeacherId
);

// get all live courses
router.get(
  "/live",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  courseController.getAllLiveCourses
);

router.get(
  "/group",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  courseController.getAllGroupCourses
);

// get all prerecorded courses
router.get(
  "/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  courseController.getAllPrerecordedCourses
);

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  courseController.searchCourses
);

export { router as courseRouter };
