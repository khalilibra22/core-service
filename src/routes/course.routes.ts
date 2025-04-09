import express from "express";
import { CourseController } from "../controllers/course.controller";

const router = express.Router();

const courseController = new CourseController();

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

export { router as courseRouter };
