import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimalCourse.dto";
import { getCourseDto, getSessionDto } from "../utils";
import { CertificateDto } from "../dtos/certificate.dto";

export class AcademyCourseController {
  private courseService: CoursService;

  constructor() {
    this.courseService = new CoursService();
  }

  // create a course draft
  async createDraftCourse(req: Request, res: Response): Promise<void> {
    try {
      const courseSettings = await this.courseService.createCourseSettings({});
      const courseSettingsBody = {
        ...req.body,
        ownerId: req.params.id,
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

  // update a course
  async updateCourse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.courseId;
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
      };
      const updatedCourse = await this.courseService.updateCourse(courseBody);
      const minimalCourseDto = plainToInstance(
        MinimalCourseDto,
        updatedCourse,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(minimalCourseDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
