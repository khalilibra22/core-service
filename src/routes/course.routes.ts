import express from "express";
import { CourseController } from "../controllers/course.controller";
import { FeedbackController } from "../controllers/feedback.controller";

const router = express.Router();

const courseController = new CourseController();
const feedbackController = new FeedbackController();

router.post(
  "/",
  //AuthMiddleware.verifyToken,
  //ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) => await courseController.createCourse(req, res)
);

router.post(
  "/:id/sessions",
  //AuthMiddleware.verifyToken,
  //ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) => await courseController.createCourseSession(req, res)
);

//create a review
router.post(
  "/:id/reviews",
  //AuthMiddleware.verifyToken,
  //ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) => await feedbackController.createReview(req, res)
);

//create a complaint
router.post(
  "/:id/sessions/:sessionId/complaints/",
  //AuthMiddleware.verifyToken,
  //ValidationMiddleware.validate(academicBackgroundSchema),
  async (req, res) => await feedbackController.createComplaint(req, res)
);

export { router as courseRouter };
