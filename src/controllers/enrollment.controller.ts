import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { EnrollmentService } from "../services/enrollment.service";
import { EnrollmentDto } from "../dtos/enrollment.dto";
import { plainToInstance } from "class-transformer";
import { OneOnOneEnollmentDto } from "../dtos/one-on-one-enrollment.dto";
import { setPaginationHeaders } from "../utils";
import { SessionDto } from "../dtos/session.dto";
import { RefundDto } from "../dtos/refund.dto";
import { MaterialDto } from "../dtos/material.dto";
import { FeedbackService } from "../services/feedback.service";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { HttpService } from "../services/http.service";
import { NotificationService } from "../services/notification.service";
import { EnrollmentOrchestratorService } from "../services/enrollment-orchestrator.service";
import { DtoService } from "../services/dto.service";
import { SessionService } from "../services/session.service";
import { MaterialService } from "../services/material.service";
import { injectable, inject } from "tsyringe";

@injectable()
export class EnrollmentController {
  constructor(
    @inject(EnrollmentService) private enrollmentService: EnrollmentService,
    @inject(CourseService) private courseService: CourseService,
    @inject(SessionService) private sessionService: SessionService,
    @inject(MaterialService) private materialService: MaterialService,
    @inject(HttpService) private externalService: HttpService,
    @inject(FeedbackService) private feedbackService: FeedbackService,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(EnrollmentOrchestratorService) private enrollmentOrchestrator: EnrollmentOrchestratorService,
    @inject(DtoService) private dtoService: DtoService
  ) { }

  createEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.body.ownerId;
      const fcmToken = req.body.fcmToken as string | undefined;

      const { topic } = await this.enrollmentOrchestrator.enrollStudentInCourse(
        req.params.id,
        studentId,
        fcmToken,
        req.body.method
      );

      res.status(201).json({
        message: "Enrollment created successfully",
        notificationTopics: {
          course: topic,
        },
      });
    } catch (error: any) {
      req.log.error(
        { err: error, courseId: req.params.id },
        "createEnrollment failed"
      );
      if (
        error.message.includes("not found") ||
        error.message.includes("Course is canceled")
      ) {
        res.status(404).json({ error: error.message });
      } else if (
        error.message.includes("already enrolled") ||
        error.message.includes("Course is full")
      ) {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  createOneOnOneEnrollment = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { teacherId, ownerId, topicId, sessionsNumber, isPaid, availabilityIds, sessions, fcmToken, allowUnavailable, method } =
        req.body;

      // Basic validation
      if (!isPaid) {
        // checks...
      }

      const { topic } = await this.enrollmentOrchestrator.enrollStudentOneOnOne({
        teacherId,
        studentId: ownerId,
        topicId,
        sessionsNumber,
        availabilityIds,
        sessions,
        isPaid,
        fcmToken,
        allowUnavailable,
        method,
      });

      res.status(201).json({
        message: "Enrollment created successfully",
        notificationTopics: { oneOnOne: topic },
      });
    } catch (error: any) {
      req.log.error(
        { err: error },
        "createOneOnOneEnrollment failed"
      );
      if (error.message.includes("No sessions provided")) {
        res.status(400).json({ error: error.message });
      } else if (
        error.message.includes("is in the past") ||
        (error.message.includes("is a") && error.message.includes("but the availability is for")) ||
        error.message.includes("is missing start or end time")
      ) {
        res.status(400).json({ error: error.message });
      } else if (
        error.message.includes("is already reserved until") ||
        error.message.includes("is already booked") ||
        error.message.includes("Duplicate session requested")
      ) {
        res.status(409).json({ error: error.message.replace("Failed to map selected dates: ", "") });
      } else if (error?.response?.data?.message) {
        res.status(error.response.status).json({ error: error.response.data.message });
      } else if (
        error.message.includes("Some time slotes aleardy scheduled") ||
        error.message.includes("400")
      ) {
        res.status(409).json({ error: "Some time slotes aleardy scheduled" });
      } else if (error.message.includes("Failed to map selected dates")) {
        res.status(400).json({ error: error.message.replace("Failed to map selected dates: ", "") });
      } else {
        res.status(500).json({ error: "Internal Server Error" });
      }
    }
  };

  getCourseEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const enrollments = await this.enrollmentService.getCourseEnrollments(id);

      const enrollmentDtos: EnrollmentDto[] = await this.dtoService.enrichDto(
        EnrollmentDto,
        enrollments
      );

      res.status(200).json(enrollmentDtos);
    } catch (error: any) {
      if (error.message === "Error fetching user") {
        res
          .status(404)
          .json({ error: "Some availabilities are not available" });
        return;
      }
      req.log.error({ err: error, courseId: req.params.id }, "getCourseEnrollments failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getOneOnOneEnrollmentByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.id;
      if (teacherId !== req.body.ownerId) {
        res
          .status(403)
          .json({ error: "You are not the owner of this teacher profile" });
        return;
      }
      const enrollments =
        await this.enrollmentService.getOneOnOneEnrollmentByTeacherId(
          teacherId
        );

      const enrollmentDtos: OneOnOneEnollmentDto[] = await this.dtoService.enrichDto(
        OneOnOneEnollmentDto,
        enrollments,
        {
          topicIdFields: ["sessions.0.topicId"],
        }
      );

      res.status(200).json(enrollmentDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.id }, "getOneOnOneEnrollementByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateCourseEnrollmentStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const enrollment = await this.enrollmentService.getEnrollmentById(
        req.params.id
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      enrollment.status = req.body.status;
      const updatedEnrollment = await this.enrollmentService.updateEnrollment(
        enrollment
      );
      res
        .status(200)
        .json({ message: "Enrollment status updated successfully" });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "updateCourseEnrollmentStatus failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get student's enrollments by student id
  getStudentEnrollments = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const studentId = req.body.ownerId;
      const type = req.query.type as string | undefined;

      // Validate type parameter if provided
      const validTypes = ["one-on-one", "live", "group", "prerecorded"];
      if (type && !validTypes.includes(type)) {
        res.status(400).json({ error: "Invalid type. Must be one of: one-on-one, live, group, prerecorded" });
        return;
      }

      const coursesEnrollments =
        await this.enrollmentService.getStudentCoursesEnrollments(studentId);
      const ones =
        await this.enrollmentService.getStudentOneOnOneEnrollments(studentId);
      const allEnrollmentDtos = {
        "one-on-one": await this.dtoService.enrichDto<OneOnOneEnollmentDto[]>(
          OneOnOneEnollmentDto,
          ones,
          {
            topicIdFields: ["sessions.0.topicId"],
          }
        ),
        live: await this.dtoService.enrichDto<EnrollmentDto[]>(
          EnrollmentDto,
          coursesEnrollments.filter((e) => e.course?.type === "live")
        ),
        group: await this.dtoService.enrichDto<EnrollmentDto[]>(
          EnrollmentDto,
          coursesEnrollments.filter((e) => e.course?.type === "group")
        ),
        prerecorded: await this.dtoService.enrichDto<EnrollmentDto[]>(
          EnrollmentDto,
          coursesEnrollments.filter((e) => e.course?.type === "prerecorded")
        ),
      };

      // If type filter is specified, return only that type
      if (type) {
        res.status(200).json(allEnrollmentDtos[type as keyof typeof allEnrollmentDtos]);
      } else {
        res.status(200).json(allEnrollmentDtos);
      }
    } catch (error) {
      req.log.error({ err: error, studentId: req.body?.ownerId }, "getStudentEnrollments failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // cancel one on one enrollment by id
  cancelOneOnOneEnrollment = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await this.enrollmentService.getEnrollmentById(
        enrollmentId
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (
        req.body.ownerId !== enrollment.studentId &&
        req.body.ownerId !== enrollment.teacherId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to cancel this enrollment" });
        return;
      }
      if (enrollment.status === "canceled") {
        res.status(409).json({ error: "Enrollment is already canceled" });
        return;
      }
      const enrollmentBody = {
        ...enrollment,
        status: "canceled",
        canceledBy: req.body.ownerId,
        cancellationReason: req.body.reason,
      };
      await this.enrollmentService.updateEnrollment(enrollmentBody);
      /*
      TODO: add logic to free up the teacher's availability slots
      by calling the external service to update the availability status

      Check if is there is a payment service to handle refunds
      If yes, call the payment service to process the refund, in app refund policy
      */

      res
        .status(200)
        .json({ message: "One-on-one enrollment canceled successfully" });
    } catch (error) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "cancelOneOnOneEnrollment failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getOneOnOneEnrollmentSessions = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await this.enrollmentService.getEnrollmentById(
        enrollmentId
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (
        req.body.ownerId !== enrollment.studentId &&
        req.body.ownerId !== enrollment.teacherId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to view sessions for this enrollment" });
        return;
      }
      const sessions =
        await this.sessionService.getOneOnOneSessionsByEnrollmentId(
          enrollmentId
        );
      const sessionDtos = await this.dtoService.enrichDto<SessionDto[]>(SessionDto, sessions, {
        userIdFields: ["enrollment.studentId", "enrollment.teacherId"]
      });
      res.status(200).json(sessionDtos);
    } catch (error) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "getOneOnOneEnrollmentSessions failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addMaterialsToOneOnOneEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const { materialIds } = req.body;
      const enrollment = await this.enrollmentService.getEnrollmentById(enrollmentId);
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (enrollment.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can add materials" });
        return;
      }
      await this.materialService.addMaterialsToEnrollment(enrollmentId, materialIds);
      res.status(200).json({ message: "Materials added to enrollment successfully" });
    } catch (error: any) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "addMaterialsToOneOnOneEnrollment failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateEnrollmentMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const { materialIds } = req.body;
      const enrollment = await this.enrollmentService.getEnrollmentById(enrollmentId);
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (enrollment.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can update materials" });
        return;
      }
      await this.materialService.updateEnrollmentMaterials(enrollmentId, materialIds);
      res.status(200).json({ message: "Enrollment materials updated successfully" });
    } catch (error: any) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "updateEnrollmentMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addMaterialsToSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const { materialIds } = req.body;
      const session = await this.sessionService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.enrollment?.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can add materials" });
        return;
      }
      await this.materialService.addMaterialsToSession(sessionId, materialIds);
      res.status(200).json({ message: "Materials added to session successfully" });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.sessionId }, "addMaterialsToSession failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateSessionMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const { materialIds } = req.body;
      const session = await this.sessionService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.enrollment?.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can update materials" });
        return;
      }
      await this.materialService.updateSessionMaterials(sessionId, materialIds);
      res.status(200).json({ message: "Session materials updated successfully" });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.sessionId }, "updateSessionMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createRefundRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await this.enrollmentService.getEnrollmentById(
        enrollmentId
      );
      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }
      if (enrollment.studentId !== req.body.ownerId) {
        res
          .status(403)
          .json({ error: "You are not the owner of this enrollment" });
        return;
      }
      req.body.studentId = req.body.ownerId;
      delete req.body.ownerId;

      const refundBody = {
        ...req.body,
        enrollment,
        type: "refund",
      };
      const refund = await this.feedbackService.createComplaint(refundBody);
      // TODO: add logic to send email to the teacher
      //get student details
      const student = await LruInMemoryCache.getUserDetails(refund.studentId ?? "keynotfound");
      const refundDto = plainToInstance(RefundDto, { ...refund, studentFullname: student?.fullname ?? "keynotfound" }, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(refundDto);
    } catch (error) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "createRefundRequest failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addRefundInitialResponse = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const refundId = req.params.refundId;
      const refund = await this.feedbackService.getRefundComplaintById(
        refundId
      );
      if (!refund) {
        res.status(404).json({ error: "Refund not found" });
        return;
      }
      if (
        refund.enrollment?.teacherId !== req.body.ownerId &&
        refund.enrollment?.course?.ownerId !== req.body.ownerId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to respond to this refund" });
        return;
      }
      if (refund.status !== "pending") {
        res.status(409).json({ error: "refund already treated" });
        return;
      }
      delete req.body.ownerId;

      const refundBody = {
        ...refund,
        ...req.body,
        status: "responded",
      };

      const updatedRefund = await this.feedbackService.updateComplaint(
        refundBody
      );
      //get student details
      const student = await LruInMemoryCache.getUserDetails(updatedRefund?.studentId ?? "keynotfound");
      const refundDto = plainToInstance(RefundDto, { ...updatedRefund, studentFullname: student?.fullname ?? "keynotfound" }, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(refundDto);
    } catch (error) {
      req.log.error({ err: error, refundId: req.params.refundId }, "addRefundInitialResponse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  refundStudentDecision = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const refundId = req.params.refundId;
      const refund = await this.feedbackService.getComplaintById(refundId);
      if (!refund) {
        res.status(404).json({ error: "Refund not found" });
        return;
      }
      if (refund.studentId !== req.body.ownerId) {
        res
          .status(403)
          .json({ error: "You are not the owner of this enrollment" });
        return;
      }

      if (refund.status !== "responded") {
        res.status(409).json({ error: "Decision already sent" });
        return;
      }
      refund.studentDecision = req.body.studentDecision;
      req.body.studentDecision === "accepted"
        ? (refund.status = "resolved")
        : (refund.status = "escalated");

      const updatedRefund = await this.feedbackService.updateComplaint(refund);
      // TODO : in app refund in the case of accepted refund request
      //get student details
      const student = await LruInMemoryCache.getUserDetails(updatedRefund?.studentId ?? "keynotfound");
      const refundDto = plainToInstance(RefundDto, { ...updatedRefund, studentFullname: student?.fullname ?? "keynotfound" }, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(refundDto);
    } catch (error) {
      req.log.error({ err: error, refundId: req.params.refundId }, "refundStudentDecision failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  refundAdminResolve = async (req: Request, res: Response): Promise<void> => {
    try {
      const refundId = req.params.refundId;
      const refund = await this.feedbackService.getComplaintById(refundId);
      if (!refund) {
        res.status(404).json({ error: "Refund not found" });
        return;
      }
      if (refund.status !== "escalated") {
        res
          .status(409)
          .json({ error: "Refund is not escalated or already resolved" });
        return;
      }
      req.body.resolvedBy = req.body.ownerId; // Assuming the resolver is the owner
      delete req.body.ownerId;
      const refundBody = {
        ...refund,
        ...req.body,
        status: "resolved",
      };
      const updatedRefund = await this.feedbackService.updateComplaint(
        refundBody
      );
      //get student details
      const student = await LruInMemoryCache.getUserDetails(updatedRefund?.studentId ?? "keynotfound");
      const refundDto = plainToInstance(RefundDto, { ...updatedRefund, studentFullname: student?.fullname ?? "keynotfound" }, {
        excludeExtraneousValues: true,
      });
      // TODO : in app refund
      res.status(200).json(refundDto);
    } catch (error) {
      req.log.error({ err: error, refundId: req.params.refundId }, "refundAdminResolve failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getStudentEnrolledCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const studentId = req.body.ownerId;
      const courseType = req.query.type as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const courseTypeList = ["live", "group", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }

      const { data: courses, total } = await this.courseService.getStudentEnrolledCourses(
        studentId,
        page,
        limit,
        courseType
      );
      const courseDtos = await this.dtoService.getCourseDto(courses, courseType);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, studentId: req.body?.ownerId, type: req.query?.type }, "getStudentEnrolledCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getEnrollmentMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const enrollmentId = req.params.id;
      const enrollment = await this.enrollmentService.getEnrollmentWithMaterials(enrollmentId);

      if (!enrollment) {
        res.status(404).json({ error: "Enrollment not found" });
        return;
      }

      if (enrollment.type !== "one-on-one") {
        res.status(400).json({ error: "This endpoint is only for one-on-one enrollments" });
        return;
      }

      const isStudent = enrollment.studentId === req.body.ownerId;
      const isTeacher = enrollment.teacherId === req.body.ownerId;

      if (!isStudent && !isTeacher) {
        res.status(403).json({ error: "You are not authorized to view these materials" });
        return;
      }

      const materialLinks = enrollment.materialLinks || [];
      const materialDtos = materialLinks.map((link) =>
        plainToInstance(MaterialDto, link, { excludeExtraneousValues: true })
      );

      res.status(200).json(materialDtos);
    } catch (error: any) {
      req.log.error({ err: error, enrollmentId: req.params.id }, "getEnrollmentMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAvailabilityBookedDates = async (req: Request, res: Response): Promise<void> => {
    try {
      const availabilityId = req.params.id;
      const bookedDates = await this.sessionService.getBookedDatesByAvailability(availabilityId);
      res.status(200).json({ bookedDates });
    } catch (error: any) {
      req.log.error({ err: error, availabilityId: req.params.id }, "getAvailabilityBookedDates failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
