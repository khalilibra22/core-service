import express from "express";
import { container } from "../../container";
import { CourseController } from "../../controllers/course.controller";
import { CourseSessionController } from "../../controllers/course-session.controller";
import { CourseMaterialController } from "../../controllers/course-material.controller";
import { CourseCertificateController } from "../../controllers/course-certificate.controller";
import { FeedbackController } from "../../controllers/feedback.controller";
import { EnrollmentController } from "../../controllers/enrollment.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import {
  certificateValidationSchema,
  courseCancellationValidationSchema,
  courseValidationSchema,
  createCourseValidationSchema,
  sessionValidationSchema,
  removeMaterialsSchema,
  toggleLessonMaterialShareValidationSchema,
  courseMaterialsSchema,
  createStudentRequestValidationSchema,
  updateStudentRequestStatusValidationSchema,
  updateCourseProgressValidationSchema,
} from "../../validations/course.validation";
import { reviewValdationSchema } from "../../validations/feedback.validation";
import { enrollmentValidationsSchema } from "../../validations/enrollment.validation";
import { AuthMiddleware } from "../../utils/auth.middleware";

const router = express.Router();

const courseController = container.resolve(CourseController);
const sessionController = container.resolve(CourseSessionController);
const materialController = container.resolve(CourseMaterialController);
const certificateController = container.resolve(CourseCertificateController);
const feedbackController = container.resolve(FeedbackController);
const enrollmentController = container.resolve(EnrollmentController);

router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(createCourseValidationSchema),
  (req, res) => courseController.createDraftCourse(req, res)
);

//update course
router.put(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseValidationSchema),
  (req, res) => courseController.updateCourse(req, res)
);

router.put(
  "/:id/draft",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseValidationSchema),
  (req, res) => courseController.updateDraftCourse(req, res)
);

//delete course
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  (req, res) => courseController.deleteCourse(req, res)
);

// get course by id
router.get(
  "/:id/details",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  (req, res) => courseController.getCourseById(req, res)
);

router.post(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  (req, res) => sessionController.createCourseSession(req, res)
);

//update session
router.put(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  ValidationMiddleware.validate(sessionValidationSchema),
  (req, res) => sessionController.updateCourseSession(req, res)
);

// delete session
router.delete(
  "/:id/sessions/:sessionId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "manage_sessions"),
  (req, res) => sessionController.deleteCourseSession(req, res)
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

//update a review
router.put(
  "/:id/reviews/:reviewId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  ValidationMiddleware.validate(reviewValdationSchema),
  feedbackController.updateCourseReview
);

//delete a review
router.delete(
  "/:id/reviews/:reviewId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("reviews", "submit_review"),
  feedbackController.deleteCourseReview
);

//create a certificate
router.post(
  "/:id/certificates",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(certificateValidationSchema),
  (req, res) => certificateController.createCertificate(req, res)
);

// Create course enrollment
router.post(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "enroll_course"),
  ValidationMiddleware.validate(enrollmentValidationsSchema),
  (req, res) => enrollmentController.createEnrollment(req, res)
);

// get course by id
router.patch(
  "/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(courseMaterialsSchema),
  (req, res) => materialController.addCourseMaterials(req, res)
);

// get course materials
router.get(
  "/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  (req, res) => materialController.getCourseMaterials(req, res)
);

// remove course materials
router.delete(
  "/:id/materials",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(removeMaterialsSchema),
  (req, res) => materialController.removeCourseMaterials(req, res)
);

// toggle share/unshare all course materials
router.patch(
  "/:id/materials/share",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(toggleLessonMaterialShareValidationSchema),
  (req, res) => materialController.toggleCourseMaterialsShare(req, res)
);

// toggle share/unshare one course material
router.patch(
  "/:id/materials/:materialId/share",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  (req, res) => materialController.toggleCourseMaterialShare(req, res)
);

// Get all course sessions
router.get(
  "/:id/sessions",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => sessionController.getCourseSessions(req, res)
);

// Get all prerecorded course sections
router.get(
  "/:id/prerecorded-sections",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "view"),
  (req, res) => sessionController.getPrerecordedCourseSections(req, res)
);

//cancel course
router.patch(
  "/:id/cancel",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "cancel_course"),
  ValidationMiddleware.validate(courseCancellationValidationSchema),
  (req, res) => courseController.cancelCourse(req, res)
);

router.get(
  "/:id/enrollments",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("enrollments", "manage_enrollments"),
  (req, res) => enrollmentController.getCourseEnrollments(req, res)
);

router.get(
  "/teachers/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  (req, res) => courseController.getCoursesByTeacherId(req, res)
);

// get all live courses
router.get(
  "/live",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  (req, res) => courseController.getAllLiveCourses(req, res)
);

router.get(
  "/group",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  (req, res) => courseController.getAllGroupCourses(req, res)
);

// get all prerecorded courses
router.get(
  "/prerecorded",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_all_courses"),
  (req, res) => courseController.getAllPrerecordedCourses(req, res)
);

router.get(
  "/",
  //AuthMiddleware.verifyToken,
  (req, res) => courseController.searchCourses(req, res)
);

// Student request routes
router.post(
  "/:id/requests",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  ValidationMiddleware.validate(createStudentRequestValidationSchema),
  (req, res) => courseController.createStudentRequest(req, res)
);

router.get(
  "/:id/requests",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  (req, res) => courseController.getCourseStudentRequests(req, res)
);

router.get(
  "/:id/requests/summary",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  (req, res) => courseController.getCourseStudentRequestSummary(req, res)
);

router.patch(
  "/:id/requests/:requestId",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "manage_courses"),
  ValidationMiddleware.validate(updateStudentRequestStatusValidationSchema),
  (req, res) => courseController.updateStudentRequestStatus(req, res)
);

// Course progress routes
router.patch(
  "/:id/progress",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  ValidationMiddleware.validate(updateCourseProgressValidationSchema),
  (req, res) => courseController.updateCourseProgress(req, res)
);

router.get(
  "/:id/progress",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  (req, res) => courseController.getCourseProgress(req, res)
);

router.get(
  "/:id/certificate-request",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("courses", "view"),
  (req, res) => courseController.getStudentCourseCertificateRequest(req, res)
);

export { router as courseRouter };
