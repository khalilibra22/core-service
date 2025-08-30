import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { EnrollmentService } from "../services/enrollment.service";
import { EnrollmentDto } from "../dtos/enrollment.dto";
import { plainToInstance } from "class-transformer";
import { OneOnOneEnollmentDto } from "../dtos/oneOnOneEnrollment.dto";
import { generateSessionsFromAvailabilities } from "../utils";
import { ExternalService } from "../services/external.service";
import { all } from "axios";

export class EnrollmentController {
  private enrollmentService: EnrollmentService;
  private courseService: CourseService;
  private externalService: ExternalService;

  constructor() {
    this.enrollmentService = new EnrollmentService();
    this.courseService = new CourseService();
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
      const { teacherId, ownerId, topicId, sessionsNumber, isPaid } = req.body;
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
      if (!availabilityIdsArray || availabilityIdsArray.length === 0) {
        res.status(400).json({ error: "No sessions provided" });
        return;
      }
      const availabilities =
        await this.externalService.checkTeacherAvailabilities(
          availabilityIdsArray
        );
      const sessions = generateSessionsFromAvailabilities(
        availabilities,
        topicId,
        sessionsNumber
      );
      const enrollmentBody = {
        studentId: ownerId,
        teacherId: teacherId,
        sessions: sessions,
      };
      await this.enrollmentService.createSessionEnrollment(enrollmentBody);
      await this.externalService.updateAvailabilitiesStatus(
        availabilityIdsArray
      );

      res.status(201).json({ message: "Enrollment created successfully" });
    } catch (error: any) {
      console.log("Error in createOneOnOneErollment:", error);
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
      const liveEnrollments = coursesEnrollments.filter(
        (enrollment) => enrollment.course?.type === "live"
      );
      const groupEnrollments = coursesEnrollments.filter(
        (enrollment) => enrollment.course?.type === "group"
      );
      const allEnrollmentDtos = {
        "one-on-one": plainToInstance(
          OneOnOneEnollmentDto,
          oneOnOneEnrollments,
          {
            excludeExtraneousValues: true,
          }
        ),
        live: plainToInstance(EnrollmentDto, liveEnrollments, {
          excludeExtraneousValues: true,
        }),
        group: plainToInstance(EnrollmentDto, groupEnrollments, {
          excludeExtraneousValues: true,
        }),
      };

      res.status(200).json(allEnrollmentDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // cancel one on one enrollment by id
  async cancelOneOnOneEnrollment(req: Request, res: Response): Promise<void> {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await this.enrollmentService.getOneOnOneEnrollmentById(
        enrollmentId
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (enrollment.status === "canceled") {
        res.status(409).json({ error: "Enrollment is already canceled" });
        return;
      }
      enrollment.status = "canceled";
      await this.enrollmentService.updateOneOnOneEnrollment(enrollment);
      /*
      TODO: add logic to free up the teacher's availability slots
      by calling the external service to update the availability status

      Check if is there is a payment service to handle refunds
      If yes, call the payment service to process the refund, in app refund policy
      */

      // const availabilityIds = enrollment.sessions.map(
      //   (session) => session.availabilityId
      // );
      // await this.externalService.updateAvailabilitiesStatus(
      //   availabilityIds,
      //   "available"
      // );
      res
        .status(200)
        .json({ message: "One-on-one enrollment canceled successfully" });
    } catch (error) {
      console.error("Error in cancelOneOnOneEnrollment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
