import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimalCourse.dto";
import { PrerecordedCourseDto } from "../dtos/prerecordedCourse.dto";
import { GroupClassDto } from "../dtos/groupClass.dto";
import { LiveCourseDto } from "../dtos/liveCourse.dto";

export class CourseController {
  private courseService: CoursService;
  constructor() {
    this.courseService = new CoursService();
  }

  // create course as draft status

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
      const certificateBody = {
        ...req.body,
        course: course,
      };
      const certificate = await this.courseService.createCertificate(
        certificateBody
      );
      res.status(201).json(certificate);
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
      res.status(200).json(sessions);
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
      // TODO: cancelation is only allowed if the course is not started yet and up to 48 hours before the course starts

      if (course.couresSettings) {
        course.couresSettings.isCanceled = true;
        course.couresSettings.reasonOfCancellation =
          req.body.reasonOfCancellation;
        course.couresSettings.canceledBy = req.body.canceledBy;
      }
      await this.courseService.updateCourse(course);

      res.status(200).json({ message: "Course canceled successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get course by id
  async getCourseById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      let courseDto;
      switch (course.type) {
        case "group":
          courseDto = plainToInstance(GroupClassDto, course, {
            excludeExtraneousValues: true,
          });
          break;
        case "live":
          courseDto = plainToInstance(LiveCourseDto, course, {
            excludeExtraneousValues: true,
          });
          break;
        case "prerecorded":
          courseDto = plainToInstance(PrerecordedCourseDto, course, {
            excludeExtraneousValues: true,
          });
          break;
        default:
          courseDto = plainToInstance(MinimalCourseDto, course, {
            excludeExtraneousValues: true,
          });
          break;
      }
      res.status(200).json(courseDto);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
