import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { EnrollmentService } from "../services/enrollment.service";

export class EnrollmentController {
  private enrollmentService: EnrollmentService;
  private courseService: CoursService;

  constructor() {
    this.enrollmentService = new EnrollmentService();
    this.courseService = new CoursService();
  }

  async createEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.type === "one-on-one") {
        const sessionArray = req.body.sessions as string[];
        delete req.body.sessions;
        sessionArray.forEach(async (sessionId) => {
          const session = await this.courseService.getSessionById(sessionId);
          if (!session) {
            res.status(404).json({ error: "Session not found" });
            return;
          }
          const enrollmentBody = {
            ...req.body,
            session: session,
          };

          await this.enrollmentService.createSessionEnrollment(enrollmentBody);
          session.isReserved = true;
          this.courseService.updateSession(session);
        });
      }
      const enrollmentBody = {
        ...req.body,
        course: course,
      };
      const enrollment = await this.enrollmentService.createCourseEnrollment(
        enrollmentBody
      );
      res.status(201).json(enrollment);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
