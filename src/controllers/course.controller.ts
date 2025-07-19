import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimalCourse.dto";
import { getCourseDto, getSessionDto } from "../utils";
import { CertificateDto } from "../dtos/certificate.dto";

export class CourseController {
  private courseService: CoursService;
  constructor() {
    this.courseService = new CoursService();
  }

  async createDraftCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseSettings = await this.courseService.createCourseSettings({});
      const courseSettingsBody = {
        ...req.body,
        couresSettings: courseSettings,
      };
      const course = await this.courseService.createCourse(courseSettingsBody);
      const minimalCourseDto = plainToInstance(MinimalCourseDto, course, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(minimalCourseDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.type !== req.body.type) {
        res.status(400).json({ error: "Course type cannot be changed" });
        return;
      }
      const courseSettingsFromBody = plainToInstance(
        CourseSettingsModel,
        req.body,
        {
          excludeExtraneousValues: false,
        }
      );
      delete req.body.ownerId; // ownerId is not allowed to be updated
      const courseFromBody = plainToInstance(CourseModel, req.body, {
        excludeExtraneousValues: false,
      });

      const courseBody = {
        id: id,
        ...course,
        ...courseFromBody,
        couresSettings: { ...course.couresSettings, ...courseSettingsFromBody },
        status: "published",
      };
      await this.courseService.updateCourse(courseBody);
      res.status(200).json({ message: "Course updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateDraftCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.status !== "draft") {
        res.status(409).json({ error: "Course is not in draft status" });
        return;
      }
      if (course.type !== req.body.type) {
        res.status(400).json({ error: "Course type cannot be changed" });
        return;
      }
      const courseSettingsFromBody = plainToInstance(
        CourseSettingsModel,
        req.body,
        {
          excludeExtraneousValues: false,
        }
      );
      delete req.body.ownerId; // ownerId is not allowed to be updated
      const courseFromBody = plainToInstance(CourseModel, req.body, {
        excludeExtraneousValues: false,
      });

      const courseBody = {
        id: id,
        ...course,
        ...courseFromBody,
        couresSettings: { ...course.couresSettings, ...courseSettingsFromBody },
      };
      await this.courseService.updateCourse(courseBody);
      res.status(200).json({ message: "Course updated successfully" });
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
      if (course.type !== req.body.type) {
        res.status(400).json({ error: "Invalid session type" });
        return;
      }
      delete req.body.type, req.body.ownerId; // type and ownerId are not allowed to be updated
      const sessionBody = {
        ...req.body,
        course: course,
      };
      const session = await this.courseService.createCourseSession(sessionBody);
      const sessionDto = getSessionDto(session, course.type ?? "session");
      res.status(201).json(sessionDto);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateCourseSession(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const sessionId = req.params.sessionId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      delete req.body.type, req.body.ownerId; // type and ownerId are not allowed to be updated

      const sessionBody = {
        id: sessionId,
        ...session,
        ...req.body,
      };

      const sessionu = await this.courseService.updateSession(sessionBody);
      res.status(200).json({ message: "Session updated successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteCourseSession(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const sessionId = req.params.sessionId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      await this.courseService.deleteSession(sessionId);
      res.status(204).json({ message: "Session deleted successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // create a certificate
  async createCertificate(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      delete req.body.ownerId;
      const certificateBody = {
        ...req.body,
        course: course,
      };
      const certificate = await this.courseService.createCertificate(
        certificateBody
      );

      const certificateDto = plainToInstance(CertificateDto, certificate, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(certificateDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCourseSessions(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const sessions = await this.courseService.getCourseSessions(id);
      const sessionDtos = getSessionDto(sessions, course.type ?? "session");
      res.status(200).json(sessionDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // cancel course
  async cancelCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      // TODO: check if user is allowed to cancel the course
      // TODO: check if course is already canceled
      // TODO: check if its canceled by the instructor or student
      // TODO: 50% if it's canceled by the student and 100% if it's canceled by the instructor
      //cancelation is only allowed if the course is not started yet and up to 48 hours before the course starts

      if (course.couresSettings) {
        course.couresSettings.isCanceled = true;
        course.couresSettings.reasonOfCancellation =
          req.body.reasonOfCancellation;
        course.couresSettings.canceledBy = req.body.ownerId;
      }
      await this.courseService.updateCourse(course);

      res.status(200).json({ message: "Course canceled successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const courseDto = getCourseDto(course, course.type ?? "minimal");
      res.status(200).json(courseDto);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //get teachers by courses by teacher id
  async getCoursesByTeacherId(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const courseType = req.query.type as string;
      const courseTypeList = ["group", "live", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }
      const courses = await this.courseService.getCoursesByTeacherId(
        id,
        courseType
      );
      const courseDtos = getCourseDto(courses, courseType);
      res.status(200).json(courseDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //get all courses of type live using pagination
  async getAllLiveCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllLiveCourses(page, limit);
      const courseDtos = getCourseDto(courses, "live");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllGroupCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllGroupCourses(page, limit);
      const courseDtos = getCourseDto(courses, "group");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //get all courses of type prerecorded using pagination
  async getAllPrerecordedCourses(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courses = await this.courseService.getAllPrerecordedCourses(
        page,
        limit
      );
      const courseDtos = getCourseDto(courses, "prerecorded");
      res.status(200).json(courseDtos);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async deleteCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      await this.courseService.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
