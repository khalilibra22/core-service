import { Request, Response } from "express";
import { CoursService } from "../services/course.service";

export class CourseController {
  private courseService: CoursService;
  constructor() {
    this.courseService = new CoursService();
  }

  async createCourse(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.createCourse(req.body);
      //   const planDto = plainToInstance(PlanDto, plan, {
      //     excludeExtraneousValues: true,
      //   });
      res.status(201).json(course);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  async createCourseSession(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const sessionBody = {
        ...req.body,
        course: course,
      };
      const session = await this.courseService.createCourseSession(sessionBody);
      res.status(201).json(session);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
