import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { EnrollmentService } from "../services/enrollment.service";
import { EnrollmentDto } from "../dtos/enrollment.dto";
import { plainToInstance } from "class-transformer";
import { OneOnOneEnollmentDto } from "../dtos/one-on-one-enrollment.dto";
import { enrichDto, generateSessionsFromAvailabilities, getCourseDto, setPaginationHeaders } from "../utils";
import { SessionDto } from "../dtos/session.dto";
import { RefundDto } from "../dtos/refund.dto";
import { FeedbackService } from "../services/feedback.service";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { HttpService } from "../services/http.service";
import { NotificationService } from "../services/notification.service";

export class EnrollmentController {
  private enrollmentService: EnrollmentService;
  private courseService: CourseService;
  private externalService: HttpService;
  private feedbackService: FeedbackService;
  private notificationService: NotificationService;

  constructor() {
    this.enrollmentService = new EnrollmentService();
    this.courseService = new CourseService();
    this.externalService = new HttpService();
    this.feedbackService = new FeedbackService();
    this.notificationService = new NotificationService();
  }

  createEnrollment = async (req: Request, res: Response): Promise<void> => {
    try {
      const course = await this.courseService.getCourseByIdWithEnrollments(
        req.params.id
      );
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      //check if course status is published
      if (course.status !== "published") {
        res
          .status(409)
          .json({ error: "Course is not published yet or canceled" });
        return;
      }
      //check if the user already enrolled
      if (
        course.enrollments?.some(
          (enrollment) => enrollment.studentId === req.body.ownerId
        )
      ) {
        res.status(409).json({ error: "User already enrolled in this course" });
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
        type: "course",
        amount: course.price || 0,
        currency: "DZD",
      };

      // Extract fcmToken before creating enrollment
      const fcmToken = req.body.fcmToken as string | undefined;
      delete enrollmentBody.fcmToken; // Remove from enrollment body

      const enrollment = await this.enrollmentService.createEnrollment(enrollmentBody, fcmToken);
      if (course.groupId) {
        const isJoined = await this.externalService.joinChatGroup(course.groupId, studentId);
      }
      // Auto-subscribe to course notifications if fcmToken provided
      const topic = `course-${course.id}`;
      if (fcmToken) {
        try {
          await this.notificationService.subscribeTokenToTopic(fcmToken, topic);
          req.log.info({ topic, enrollmentId: enrollment.id }, "Auto-subscribed to course topic");
        } catch (err) {
          req.log.warn({ err, topic }, "Failed to auto-subscribe to course topic");
        }
      }

      res.status(201).json({
        message: "Enrollment created successfully",
        notificationTopics: {
          course: topic,
        },
      });
      // //send email to teacher
      // await this.notificationService.sendEmail({
      //   to: "test@test.com",
      //   subject: "New Enrollment",
      //   text: `A new student enrolled in ${course.name}.`,
      //   from: "noreply@example.com",
      // });
    } catch (error: any) {
      req.log.error({ err: error, courseId: req.params.id }, "createEnrollment failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createOneOnOneErollment = async (
    req: Request,
    res: Response
  ): Promise<void> => {
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
        await this.externalService.checkAvailabilities(
          availabilityIdsArray
        );
      const sessions = generateSessionsFromAvailabilities(
        availabilities,
        topicId,
        sessionsNumber
      );

      // Create chat group for one-on-one enrollment before creating enrollment
      let groupId: string | null = null;
      try {
        const student = await LruInMemoryCache.getUserDetails(ownerId);
        const teacher = await LruInMemoryCache.getUserDetails(teacherId);
        const studentName = student?.fullname || ownerId;
        const teacherName = teacher?.fullname || teacherId;

        groupId = await this.externalService.createChatGroup({
          name: `1 on 1 with ${teacherName} & ${studentName}`,
          type: "one-on-one",
          ownerId: ownerId,
          members: [ownerId, teacherId], // Add both student and teacher as members
        });

        if (groupId) {
          req.log.info({ groupId, studentId: ownerId, teacherId }, "Chat group created for one-on-one enrollment");
        } else {
          req.log.warn({ studentId: ownerId, teacherId }, "Failed to create chat group for one-on-one enrollment");
        }
      } catch (err) {
        req.log.warn({ err, studentId: ownerId, teacherId }, "Error creating chat group for one-on-one enrollment");
        // Don't fail enrollment creation if chat group creation fails
      }

      const userTopic = await LruInMemoryCache.getUserTopic(topicId);
      const amount = (userTopic?.price || 0) * sessionsNumber;

      const enrollmentBody = {
        studentId: ownerId,
        teacherId: teacherId,
        sessions: sessions,
        type: "one-on-one",
        groupId: groupId, // Include groupId in enrollment body
        amount: amount,
        currency: "DZD",
      } as any;
      const enrollment = await this.enrollmentService.createEnrollment(enrollmentBody);

      // Topic for this one-on-one enrollment
      const topic = `oneonone-${enrollment.id}`;

      // Optional auto-subscribe if fcmToken provided
      const stuedentFcmToken = req.body.fcmToken as string | undefined;
      if (stuedentFcmToken) {
        try {
          await this.notificationService.subscribeTokenToTopic(stuedentFcmToken, topic);
          req.log.info({ topic, enrollmentId: enrollment.id }, "Auto-subscribed to 1:1 topic");
        } catch (err) {
          req.log.warn({ err, topic }, "Failed to auto-subscribe to 1:1 topic");
        }
      }
      const teacher = await LruInMemoryCache.getUserDetails(teacherId);
      if (teacher?.fcmToken) {
        try {
          const teacherTopic = `teacher-${teacherId}`;
          await this.notificationService.subscribeTokenToTopic(teacher.fcmToken, teacherTopic);
          //send notification to teacher and student (filter out undefined/empty tokens)
          const tokens = [teacher.fcmToken, stuedentFcmToken].filter((token): token is string => !!token && token.length >= 10);
          if (tokens.length > 0) {
            await this.notificationService.sendToTokens({
              tokens,
              title: "One-on-one Scheduled",
              body: "Your one-on-one sessions have been scheduled.",
              data: { enrollmentId: String(enrollment.id), type: "oneonone_created" },
            });
          }
          req.log.info({ teacherTopic, enrollmentId: enrollment.id }, "Notification sent to teacher");
        } catch (err) {
          req.log.warn({ err, teacherFcmToken: teacher.fcmToken }, "Failed to send notification to teacher");
        }
      }
      await this.externalService.updateAvailabilitiesToUnavailable(
        availabilityIdsArray
      );
      res.status(201).json({
        message: "Enrollment created successfully",
        notificationTopics: { oneOnOne: topic },
      });
    } catch (error: any) {
      req.log.error({ err: error, teacherId: req.body?.teacherId, ownerId: req.body?.ownerId, topicId: req.body?.topicId, sessionsNumber: req.body?.sessionsNumber }, "createOneOnOneErollment failed");
      if (error.message.includes("400")) {
        res.status(409).json({ error: "Some time slotes aleardy scheduled" });
        return;
      }

      res.status(500).json({ error: "Internal Server Error" });
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
      const enrollmentDtos = await Promise.all(
        enrollments.map(async (enrollment) => {
          const teacher = await LruInMemoryCache.getUserDetails(
            enrollment.teacherId ?? enrollment.course?.ownerId ?? "keynotfound"
          );
          const student = await LruInMemoryCache.getUserDetails(
            enrollment.studentId ?? "keynotfound"
          );
          const enrollmentDto = {
            ...enrollment,
            teacherFullname: teacher?.fullname ?? "keynotfound",
            studentFullname: student?.fullname ?? "keynotfound",
            studentEmail: student?.email ?? "keynotfound",
            studentPhone: student?.phoneNumber ?? "keynotfound",
            address: teacher?.address ?? "keynotfound",
          };
          return plainToInstance(EnrollmentDto, enrollmentDto, {
            excludeExtraneousValues: true,
          });
        })
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

  getOneOnOneEnrollementByTeacherId = async (
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
        await this.enrollmentService.getOneOnOneEnrollementByTeacherId(
          teacherId
        );
      const enrollmentDtos = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await LruInMemoryCache.getUserDetails(
            enrollment.studentId ?? "keynotfound"
          );
          const teacher = await LruInMemoryCache.getUserDetails(
            enrollment.teacherId ?? "keynotfound"
          );
          const topic = await LruInMemoryCache.getUserTopic(
            enrollment?.sessions?.[0]?.topicId ?? 0
          );
          req.log.info({ topic }, "Fetched topic for enrollment");
          const enrollmentDto = {
            ...enrollment,
            studentFullname: student?.fullname ?? "keynotfound",
            teacherFullname: teacher?.fullname ?? "keynotfound",
            address: teacher?.address ?? "keynotfound",
            topicName: topic?.topic.name ?? "keynotfound",
          };
          return plainToInstance(OneOnOneEnollmentDto, enrollmentDto, {
            excludeExtraneousValues: true,
          });
        })
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
      // get courses enrollments with teacher details / student details
      const coursesEnrollmentsWithDetails = await Promise.all(
        coursesEnrollments.map(async (enrollment) => {
          const teacher = await LruInMemoryCache.getUserDetails(
            enrollment.teacherId ?? "keynotfound"
          );
          const student = await LruInMemoryCache.getUserDetails(
            enrollment.studentId ?? "keynotfound"
          );
          return {
            ...enrollment,
            teacherFullname: teacher?.fullname ?? "keynotfound",
            studentFullname: student?.fullname ?? "keynotfound",
            address: teacher?.address ?? "keynotfound",
          };
        })
      );
      const oneOnOneEnrollments =
        await this.enrollmentService.getStudentOneOnOneEnrollments(studentId);
      const liveEnrollments = coursesEnrollmentsWithDetails.filter(
        (enrollment) => enrollment.course?.type === "live"
      );
      // get one on one enrollments with student details / teacher details
      const oneOnOneEnrollmentsWithDetails = await Promise.all(
        oneOnOneEnrollments.map(async (enrollment) => {
          if (!enrollment.studentId || !enrollment.teacherId) {
            return null;
          }
          const student = await LruInMemoryCache.getUserDetails(
            enrollment.studentId
          );
          const teacher = await LruInMemoryCache.getUserDetails(
            enrollment.teacherId
          );
          return {
            ...enrollment,
            studentFullname: student?.fullname ?? "keynotfound",
            teacherFullname: teacher?.fullname ?? "keynotfound",
            address: teacher?.address ?? "keynotfound",
          };
        })
      );
      const groupEnrollments = coursesEnrollmentsWithDetails.filter(
        (enrollment) => enrollment.course?.type === "group"
      );
      const prerecordedEnrollments = coursesEnrollmentsWithDetails.filter(
        (enrollment) => enrollment.course?.type === "prerecorded"
      );
      const allEnrollmentDtos = {
        "one-on-one": plainToInstance(
          OneOnOneEnollmentDto,
          oneOnOneEnrollmentsWithDetails,
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
        prerecorded: plainToInstance(EnrollmentDto, prerecordedEnrollments, {
          excludeExtraneousValues: true,
        }),
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
        await this.courseService.getOneOnOneSessionsByEnrollmentId(
          enrollmentId
        );
      const sessionDtos = await Promise.all(sessions.map(async (session) => {
        return await enrichDto<SessionDto>(SessionDto, session);
      }));
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
      await this.courseService.addMaterialsToEnrollment(enrollmentId, materialIds);
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
      await this.courseService.updateEnrollmentMaterials(enrollmentId, materialIds);
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
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.enrollment?.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can add materials" });
        return;
      }
      await this.courseService.addMaterialsToSession(sessionId, materialIds);
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
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.enrollment?.teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the teacher can update materials" });
        return;
      }
      await this.courseService.updateSessionMaterials(sessionId, materialIds);
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
      const courseDtos = await getCourseDto(courses, courseType);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, studentId: req.body?.ownerId, type: req.query?.type }, "getStudentEnrolledCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
