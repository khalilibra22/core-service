import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { CourseService } from "../services/course.service";
import { NotificationService } from "../services/notification.service";
import { QuizService } from "../services/quiz.service";
import { HttpService } from "../services/http.service";
import { StudentRequestService } from "../services/student-request.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/course-settings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimal-course.dto";
import { setPaginationHeaders } from "../utils";
import { DtoService } from "../services/dto.service";
import { StudentRequestDto } from "../dtos/student-request.dto";
import { CourseProgressDto } from "../dtos/course-progress.dto";

@injectable()
export class CourseController {
  constructor(
    @inject(CourseService) private courseService: CourseService,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(QuizService) private quizService: QuizService,
    @inject(HttpService) private httpService: HttpService,
    @inject(StudentRequestService) private studentRequestService: StudentRequestService,
    @inject(DtoService) private dtoService: DtoService
  ) { }

  createDraftCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseType = req.body.type as string;

      // ── Quota Guard: group and live courses require an active subscription ──
      if (courseType === "group" || courseType === "live") {
        const teacherId = req.body.ownerId as string;
        if (!teacherId) {
          res.status(400).json({ error: "ownerId is required" });
          return;
        }
        try {
          const quota = await this.httpService.checkSubscriptionQuota(teacherId, courseType as "group" | "live");
          if (!quota.hasActiveSubscription) {
            res.status(402).json({
              error: `You need an active subscription to create ${courseType} courses.`,
              code: "NO_ACTIVE_SUBSCRIPTION",
            });
            return;
          }
          const canCreate = courseType === "group" ? quota.canCreateGroup : quota.canCreateLive;
          if (!canCreate) {
            const used = courseType === "group" ? quota.groupCoursesCreated : quota.liveCoursesCreated;
            const limit = courseType === "group" ? quota.groupCourseLimit : quota.liveCourseLimit;
            res.status(403).json({
              error: `${courseType.charAt(0).toUpperCase() + courseType.slice(1)} course limit reached (${used}/${limit}). Upgrade your plan to create more.`,
              code: "QUOTA_EXCEEDED",
              quota,
            });
            return;
          }
        } catch (quotaError: any) {
          // Fail open: if quota service is unreachable don't block the teacher
          req.log.warn({ err: quotaError, teacherId, courseType }, "Quota check failed — proceeding with course creation");
        }
      }

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
      req.log.error({ err: error }, "createDraftCourse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


  updateCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      const updatedCourse = await this.courseService.updateCourse(courseBody);
      if (!course.groupId) {
        const groupId = await this.httpService.createChatGroup({
          name: updatedCourse.name,
          type: updatedCourse.type,
          ownerId: updatedCourse.ownerId,
          profilePicture: updatedCourse.thumbnail,
        });
        if (groupId) {
          updatedCourse.groupId = groupId;
          await this.courseService.updateCourse(updatedCourse);
        }
      }
      // Auto-subscribe teacher to teacher-courseId topic when publishing
      const fcmToken = req.body.fcmToken as string | undefined;
      if (fcmToken && course.status !== "published") {
        const teacherTopic = `teacher-${id}`;
        try {
          await this.notificationService.subscribeTokenToTopic(fcmToken, teacherTopic);
          req.log.info({ teacherTopic, courseId: id }, "Teacher auto-subscribed to teacher topic");
        } catch (err) {
          req.log.warn({ err, teacherTopic }, "Failed to auto-subscribe teacher to teacher topic");
        }
      }

      res.status(200).json({ message: "Course updated successfully" });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "updateCourse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateDraftCourse = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, courseId: req.params.id }, "updateDraftCourse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // cancel course
  cancelCourse = async (req: Request, res: Response): Promise<void> => {
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
      course.status = "canceled";
      await this.courseService.updateCourse(course);

      res.status(200).json({ message: "Course canceled successfully" });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "cancelCourse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseByIdNoCache(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // For prerecorded courses, add viewsCount
      if (course.type === "prerecorded") {
        try {
          const viewsCount = await this.courseService.getCourseViewCount(id);
          (course as any).viewsCount = viewsCount;
        } catch (countError) {
          req.log.warn({ err: countError, courseId: id }, "Failed to get course view count");
          (course as any).viewsCount = 0;
        }
      }

      const courseDto = await this.dtoService.getCourseDto(course, course.type ?? "minimal");
      res.status(200).json(courseDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseById failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get teachers by courses by teacher id
  getCoursesByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const id = req.params.id;
      const courseType = req.query.type as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const courseTypeList = ["group", "live", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }
      const { data: courses, total } = await this.courseService.getCoursesByTeacherId(
        id,
        courseType,
        page,
        limit
      );

      let allCourses = courses;
      if (courseType === "live") {
        allCourses = courses.map(course => {
          if (course.isRemote) {
            return {
              ...course,
              lastPandingRequestsCount: undefined,
            };
          }
          const lastPandingRequestsCount = course.enrollments?.filter(enrollment => enrollment.status === "pending" && enrollment.createdAt && enrollment.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;
          return {
            ...course,
            lastPandingRequestsCount: lastPandingRequestsCount,
          };
        });
      }

      if (courseType === "prerecorded") {
        allCourses = await Promise.all(
          courses.map(async (course) => {
            try {
              if (!course.id) {
                return {
                  ...course,
                  last24hStudentRequestsCount: 0,
                  last24hPendingStudentRequestsCount: 0,
                };
              }
              const requestSummary = await this.courseService.getCourseStudentRequestSummary(course.id);
              return {
                ...course,
                last24hStudentRequestsCount: requestSummary.last24hCount,
                last24hPendingStudentRequestsCount: requestSummary.last24hPendingCount,
              };
            } catch (error) {
              req.log.warn({ err: error, courseId: course.id }, "Failed to get student request summary");
              return {
                ...course,
                last24hStudentRequestsCount: 0,
                last24hPendingStudentRequestsCount: 0,
              };
            }
          })
        );
      }

      const courseDtos = await this.dtoService.getCourseDto(allCourses, courseType);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.id, type: req.query.type, page: req.query.page, limit: req.query.limit }, "getCoursesByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get all courses of type live using pagination
  getAllLiveCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data: courses, total } = await this.courseService.getAllLiveCourses(page, limit);
      const courseDtos = await this.dtoService.getCourseDto(courses, "live");
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, page: req.query.page, limit: req.query.limit }, "getAllLiveCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllGroupCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data: courses, total } = await this.courseService.getAllGroupCourses(page, limit);
      const courseDtos = await this.dtoService.getCourseDto(courses, "group");
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, page: req.query.page, limit: req.query.limit }, "getAllGroupCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //get all courses of type prerecorded using pagination
  getAllPrerecordedCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data: courses, total } = await this.courseService.getAllPrerecordedCourses(
        page,
        limit
      );
      const courseDtos = await this.dtoService.getCourseDto(courses, "prerecorded");
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
    } catch (error) {
      req.log.error({ err: error, page: req.query.page, limit: req.query.limit }, "getAllPrerecordedCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteCourse = async (req: Request, res: Response): Promise<void> => {
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
      await this.courseService.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "deleteCourse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  //search courses by its type using pagination with optional text search
  searchCourses = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseType = req.query.type as string;
      const courseTypeList = ["group", "live", "prerecorded"];
      if (!courseTypeList.includes(courseType)) {
        res.status(400).json({ error: "Invalid course type" });
        return;
      }
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      // Get optional search query parameter
      const searchQuery = req.query.q as string | undefined;

      // Extract filter parameters
      const level = req.query.level as string | undefined;
      const topicId = req.query.topicId ? parseInt(req.query.topicId as string) : undefined;
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
      const isCertified = req.query.isCertified === 'true' ? true : (req.query.isCertified === 'false' ? false : undefined);
      const minDuration = req.query.minDuration ? parseFloat(req.query.minDuration as string) : undefined;
      const maxDuration = req.query.maxDuration ? parseFloat(req.query.maxDuration as string) : undefined;
      const minRating = req.query.minRating ? parseFloat(req.query.minRating as string) : undefined;
      const isRemote = req.query.isRemote === 'true' ? true : (req.query.isRemote === 'false' ? false : undefined);
      const isAcademy = req.query.isAcademy === 'true' ? true : (req.query.isAcademy === 'false' ? false : undefined);
      const language = req.query.language as string | undefined;
      const subjectId = req.query.subjectId ? parseInt(req.query.subjectId as string) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;

      const { data: courses, total } = await this.courseService.searchCourses(
        courseType,
        page,
        limit,
        searchQuery,
        {
          level,
          topicId,
          minPrice,
          maxPrice,
          isCertified,
          minDuration,
          maxDuration,
          minRating,
          isRemote,
          isAcademy,
          language,
          subjectId,
          startDate
        }
      );
      const courseDtos = await this.dtoService.getCourseDto(courses, courseType);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);

    } catch (error) {
      req.log.error({ err: error, courseType: req.query.type, page: req.query.page, limit: req.query.limit, searchQuery: req.query.q }, "searchCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Student Request Methods
  createStudentRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const studentId = req.body.ownerId;
      const { type, message, payload } = req.body;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Check if student has already requested a certificate for this course
      if (type === "certificate") {
        const hasRequested = await this.studentRequestService.hasStudentRequestedCertificate(studentId, courseId);
        if (hasRequested) {
          res.status(409).json({ error: "You have already requested a certificate for this course" });
          return;
        }

        // Get course progress
        const courseProgress = await this.courseService.getCourseProgress(courseId, studentId);
        const progressionPercent = Number(courseProgress?.percentComplete ?? 0);

        // Check if course progression is at least 80%
        if (progressionPercent < 80) {
          res.status(403).json({
            error: "You must complete at least 80% of the course to request a certificate",
            progressionPercent: progressionPercent
          });
          return;
        }

        // Calculate quiz progression and score
        try {
          const quizMetrics = await this.quizService.getCourseQuizProgressionAndScore(courseId, studentId);

          // Check if quiz score is 100%
          if (quizMetrics.scorePercent < 100) {
            res.status(403).json({
              error: "You must achieve a score of 100% to request a certificate",
              progressionPercent: progressionPercent,
              scorePercent: quizMetrics.scorePercent,
              totalScore: quizMetrics.totalScore,
              totalMaxScore: quizMetrics.totalMaxScore
            });
            return;
          }

          // If checks pass, add metrics to payload
          const enhancedPayload = {
            ...payload,
            progressionPercent: progressionPercent,
            scorePercent: quizMetrics.scorePercent,
            completedQuizzes: quizMetrics.completedQuizzes,
            totalQuizzes: quizMetrics.totalQuizzes,
            totalScore: quizMetrics.totalScore,
            totalMaxScore: quizMetrics.totalMaxScore
          };

          const request = await this.courseService.createStudentRequest(
            courseId,
            studentId,
            type,
            message,
            enhancedPayload
          );
          const requestDto = await this.dtoService.enrichDto<StudentRequestDto>(StudentRequestDto, request);
          res.status(201).json(requestDto);
          return;
        } catch (quizError) {
          req.log.warn({ err: quizError, courseId, studentId }, "Failed to calculate quiz metrics for certificate request");
          // Continue with request creation even if quiz metrics calculation fails
        }
      }

      const request = await this.courseService.createStudentRequest(
        courseId,
        studentId,
        type,
        message,
        payload
      );
      const requestDto = await this.dtoService.enrichDto<StudentRequestDto>(StudentRequestDto, request);
      res.status(201).json(requestDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "createStudentRequest failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateStudentRequestStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestId = req.params.requestId;
      const { status, ownerResponse } = req.body;
      const ownerId = req.body.ownerId;

      const request = await this.courseService.getStudentRequestById(requestId);
      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      // Verify that the user is the course owner
      if (request.course?.ownerId !== ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }

      const updatedRequest = await this.courseService.updateStudentRequestStatus(
        requestId,
        status,
        ownerResponse,
        ownerId
      );

      const requestDto = plainToInstance(StudentRequestDto, updatedRequest, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(requestDto);
    } catch (error) {
      req.log.error({ err: error, requestId: req.params.requestId }, "updateStudentRequestStatus failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseStudentRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const ownerId = req.body.ownerId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Verify that the user is the course owner
      if (course.ownerId !== ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }

      const requests = await this.courseService.getStudentRequestsByCourseId(courseId);

      const requestDtos = plainToInstance(StudentRequestDto, requests, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(requestDtos);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseStudentRequests failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getOwnerStudentRequests = async (req: Request, res: Response): Promise<void> => {
    try {
      const ownerId = req.body.ownerId;

      const requests = await this.courseService.getStudentRequestsByOwnerId(ownerId);

      const requestDtos = plainToInstance(StudentRequestDto, requests, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(requestDtos);
    } catch (error) {
      req.log.error({ err: error, ownerId: req.body.ownerId }, "getOwnerStudentRequests failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseStudentRequestSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const ownerId = req.body.ownerId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Verify that the user is the course owner
      if (course.ownerId !== ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }

      const summary = await this.courseService.getCourseStudentRequestSummary(courseId);

      res.status(200).json(summary);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseStudentRequestSummary failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getStudentCourseCertificateRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const studentId = req.body.ownerId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Get certificate request directly from database
      const certificateRequest = await this.studentRequestService.getStudentCertificateRequestByCourseId(
        studentId,
        courseId
      );

      if (!certificateRequest) {
        res.status(404).json({ error: "No certificate request found for this course" });
        return;
      }

      const requestDto = await this.dtoService.enrichDto<StudentRequestDto>(StudentRequestDto, certificateRequest);
      res.status(200).json(requestDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getStudentCourseCertificateRequest failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Course Progress Methods
  updateCourseProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const studentId = req.body.ownerId;
      const { percentComplete, lastSessionId, lastLessonId } = req.body;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      if (course.type !== "prerecorded") {
        res.status(400).json({ error: "Progress tracking is only available for prerecorded courses" });
        return;
      }

      const progress = await this.courseService.upsertCourseProgress(
        courseId,
        studentId,
        percentComplete,
        lastSessionId,
        lastLessonId
      );

      const progressDto = plainToInstance(CourseProgressDto, progress, {
        excludeExtraneousValues: true,
      });

      res.status(200).json({
        message: "Progress updated successfully",
        progress: progressDto,
      });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "updateCourseProgress failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const studentId = req.body.ownerId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      if (course.type !== "prerecorded") {
        res.status(400).json({ error: "Progress tracking is only available for prerecorded courses" });
        return;
      }

      const progress = await this.courseService.getCourseProgressSummary(courseId, studentId);

      res.status(200).json(progress);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseProgress failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}