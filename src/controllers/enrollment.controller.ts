import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { EnrollmentService } from "../services/enrollment.service";
import { EnrollmentDto } from "../dtos/enrollment.dto";
import { plainToInstance } from "class-transformer";
import { OneOnOneEnollmentDto } from "../dtos/oneOnOneEnrollment.dto";
import { generateSessionsFromAvailabilities } from "../utils";
import { ExternalService } from "../services/external.service";

export class EnrollmentController {
  private enrollmentService: EnrollmentService;
  private courseService: CoursService;
  private externalService: ExternalService;

  constructor() {
    this.enrollmentService = new EnrollmentService();
    this.courseService = new CoursService();
    this.externalService = new ExternalService();
  }

  async createEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseByIdWithEnrollments(
        req.params.id
      );
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.couresSettings?.isCanceled) {
        res.status(409).json({ error: "Course is canceled" });
        return;
      }
      const studentId = req.body.ownerId;
      delete req.body.type, req.body.ownerId;

      if (course.type === "group" || course.type === "live") {
        if (
          (course.enrollments?.length ?? 0) >= (course.maxParticipants ?? 0)
        ) {
          res.status(409).json({
            error: `Course is full. Max students: ${course.maxParticipants}`,
          });
          return;
        }
      }
      const enrollmentBody = {
        ...req.body,
        studentId: studentId,
        course: course,
      };
      await this.enrollmentService.createCourseEnrollment(enrollmentBody);
      res.status(201).json({ message: "Enrollment created successfully" });
    } catch (error: any) {
      console.log(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createOneOnOneErollment(req: Request, res: Response): Promise<void> {
    try {
      req.body.studentId = req.body.ownerId;
      delete req.body.type, req.body.ownerId;
      const isPaid: boolean = req.body.isPaid;
      if (!isPaid) {
        //TODO: add logic to
        //ckeck if possible to have free one-on-one session
        // for example, check if the teacher has a free session available in their plan
        // if not possible, return 400 error
        // Example:
        //res.status(400).json({ error: "One-on-one sessions must be paid" });
        //return;
      }

      const availabilityIdsArray = req.body.availabilityIds as string[];
      delete req.body.availabilityIds;
      if (!availabilityIdsArray || availabilityIdsArray.length === 0) {
        res.status(400).json({ error: "No sessions provided" });
        return;
      }
      const availabilities =
        await this.externalService.checkTeacherAvailabilities(
          availabilityIdsArray
        );
      const sessionsNumber = req.body.sessionsNumber;
      const sessions = generateSessionsFromAvailabilities(
        availabilities,
        sessionsNumber,
        req.body.topicId
      );
      const enrollmentBody = {
        studentId: req.body.studentId,
        sessions: sessions,
      };
      await this.enrollmentService.createSessionEnrollment(enrollmentBody);
      await this.externalService.updateAvailabilitiesStatus(
        availabilityIdsArray
      );

      res.status(201).json({ message: "Enrollment created successfully" });
    } catch (error: any) {
      if (error.message.includes("Some availabilities are not available")) {
        res.status(409).json({ error: "Some time slotes aleardy scheduled" });
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCourseEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const enrollments = await this.enrollmentService.getCourseEnrollments(id);
      const enrollmentDtos = plainToInstance(EnrollmentDto, enrollments, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(enrollmentDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res
          .status(404)
          .json({ error: "Some availabilities are not available" });
        return;
      }
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getOneOnOneEnrollementByTeacherId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const teacherId = req.params.id;
      const enrollments =
        await this.enrollmentService.getOneOnOneEnrollementByTeacherId(
          teacherId
        );
      const enrollmentDtos = plainToInstance(
        OneOnOneEnollmentDto,
        enrollments,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(enrollmentDtos);
    } catch (error) {
      console.error("Error in getOneOnOneEnrollementByTeacherId:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async updateCourseEnrollmentStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const enrollment = await this.enrollmentService.getCourseEnrollmentById(
        req.params.id
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      enrollment.status = req.body.status;
      const updatedEnrollment =
        await this.enrollmentService.updateCourseEnrollment(enrollment);
      res
        .status(200)
        .json({ message: "Enrollment status updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  //get student's enrollments by student id
  async getStudentEnrollments(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.body.ownerId;
      const coursesEnrollments =
        await this.enrollmentService.getStudentCoursesEnrollments(studentId);
      const oneOnOneEnrollments =
        await this.enrollmentService.getStudentOneOnOneEnrollments(studentId);

      // merge them by type (live , group, precorded) and one-on-one as type "one-on-one"
      //lke this: "one-on-one" : [all one-on-one enrollments],
      // "live": [all live enrollments],
      // "group": [all group enrollments],
      const allEnrollments = {
        "one-on-one": oneOnOneEnrollments,
        live: coursesEnrollments.filter(
          (enrollment) => enrollment.course?.type === "live"
        ),
        group: coursesEnrollments.filter(
          (enrollment) => enrollment.course?.type === "group"
        ),
      };
      // const allEnrollments = [
      //   ...coursesEnrollments.map((enrollment) => ({
      //     ...enrollment,
      //     type: enrollment.course?.type,
      //   })),
      //   ...oneOnOneEnrollments.map((enrollment) => ({
      //     ...enrollment,
      //     type: "one-on-one",
      //   })),
      // ];

      const enrollmentDtos = plainToInstance(
        EnrollmentDto,
        coursesEnrollments,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(200).json(allEnrollments);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
