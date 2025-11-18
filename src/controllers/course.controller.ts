import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { QuizService } from "../services/quiz.service";
import { plainToInstance } from "class-transformer";
import { CourseSettingsModel } from "../models/course-settings.model";
import { CourseModel } from "../models/course.model";
import { MinimalCourseDto } from "../dtos/minimal-course.dto";
import { getCourseDto, getSessionDto, enrichDto, setPaginationHeaders } from "../utils";
import { CertificateDto } from "../dtos/certificate.dto";
import { LessonDto } from "../dtos/lesson.dto";
import { RecordedSessionDto } from "../dtos/recorded-session.dto";
import { SessionDto } from "../dtos/session.dto";
import { MaterialDto } from "../dtos/material.dto";
import { StudentRequestDto } from "../dtos/student-request.dto";
import { CourseProgressDto } from "../dtos/course-progress.dto";
import { NotificationService } from "../services/notification.service";
import { HttpService } from "../services/http.service";

export class CourseController {
  private courseService: CourseService;
  private notificationService: NotificationService;
  private quizService: QuizService;
  private httpService: HttpService;
  
  constructor() {
    this.courseService = new CourseService();
    this.notificationService = new NotificationService();
    this.quizService = new QuizService();
    this.httpService = new HttpService();
  }

  createDraftCourse = async (req: Request, res: Response): Promise<void> => {
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
      
        if(!course.groupId){
          const groupId = await this.httpService.createChatGroup({
            name: course.name,
            type: course.type,
            ownerId: course.ownerId,
          });
          req.body.groupId = groupId;
        }
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

  createCourseSession = async (req: Request, res: Response): Promise<void> => {
    try {
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
        res.status(400).json({ error: "Invalid session type" });
        return;
      }
      delete req.body.type, req.body.ownerId; // type and ownerId are not allowed to be updated
      const sessionBody = {
        ...req.body,
        course: course,
      };
      const session = await this.courseService.createCourseSession(sessionBody);
      const sessionDto = await getSessionDto(session, course.type ?? "session");
      res.status(201).json(sessionDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "createCourseSession failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateCourseSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const sessionId = req.params.sessionId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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

      await this.courseService.updateSession(sessionBody);
      res.status(200).json({ message: "Session updated successfully" });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id, sessionId: req.params.sessionId }, "updateCourseSession failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteCourseSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const sessionId = req.params.sessionId;

      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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
      req.log.error({ err: error, courseId: req.params.id, sessionId: req.params.sessionId }, "deleteCourseSession failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // create a certificate
  createCertificate = async (req: Request, res: Response): Promise<void> => {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
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

      const certificateDto = await enrichDto<CertificateDto>(CertificateDto, certificate);
      res.status(201).json(certificateDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "createCertificate failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const sessions = await this.courseService.getCourseSessions(id);
      const sessionDtos = await getSessionDto(sessions, course.type ?? "session");
      res.status(200).json(sessionDtos);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseSessions failed");
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

      const courseDto = await getCourseDto(course, course.type ?? "minimal");
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
      
      const courseDtos = await getCourseDto(allCourses, courseType);
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
      const courseDtos = await getCourseDto(courses, "live");
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
      const courseDtos = await getCourseDto(courses, "group");
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
      const courseDtos = await getCourseDto(courses, "prerecorded");
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

  createLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }      
      delete req.body.ownerId;
      const lessonBody: any = {
        ...req.body,
        session: session,
      };

      // Validate materials if provided
      const ids = lessonBody.materials;
      // Remove materials from lessonBody to avoid TypeORM issues
      delete lessonBody.materials;
      const lesson = await this.courseService.createLesson(lessonBody);
      // Add materials via link table
      if (ids && lesson.id) {
        await this.courseService.addMaterialsToLesson(lesson.id, ids);
      }
      const lessonDto = plainToInstance(
        LessonDto,
        { ...lesson, materials: undefined },
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(lessonDto);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "createLesson failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;

      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const lesson = await this.courseService.getLessonById(lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }
      delete req.body.ownerId;
      const ids = req.body.materials;
      delete req.body.materials;
      const lessonBody = {
        ...lesson,
        ...req.body,
      };
      // update materials

      delete lessonBody.materials;
      await this.courseService.updateLesson(lessonBody);
      if (ids && lesson.id) {
        await this.courseService.updateLessonMaterials(lesson.id, ids);
      }

      res.status(200).json({ message: "Lesson updated successfully" });
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId }, "updateLesson failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteLesson = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;

      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        !session.course?.ownerId ||
        session.course?.ownerId !== req.body.ownerId
      ) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const lesson = await this.courseService.getLessonById(lessonId);
      if (!lesson) {
        res.status(404).json({ error: "Lesson not found" });
        return;
      }

      await this.courseService.deleteLesson(lessonId);
      res.status(204).send();
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId }, "deleteLesson failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getLessonsBySessionId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      const lessons = await this.courseService.getLessonsBySessionId(sessionId);
      
      // Transform materialLinks to materials for DTO
      const shapedLessons = lessons.map((l: any) => ({
        ...l,
        // Keep MaterialLink objects so MaterialDto can read obj.material.* and flags
        materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
      }));

      const lessonDtos = plainToInstance(LessonDto, shapedLessons, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(lessonDtos);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "getLessonsBySessionId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getPrerecordedSessionDetails = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const sessionDetails =
        await this.courseService.getPrerecordedSessionDetails(sessionId);
      if (!sessionDetails) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (sessionDetails.course?.type !== "prerecorded") {
        res.status(400).json({ error: "Session is not a prerecorded session" });
        return;
      }
      
      // Transform materialLinks to materials for DTO
      const shapedSession = {
        ...sessionDetails,
        lessons: sessionDetails.lessons?.map((l: any) => ({
          ...l,
          materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
        })),
      };
      
      const sessionDto = plainToInstance(RecordedSessionDto, shapedSession, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(sessionDto);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "getPrerecordedSessionDetails failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getPrerecordedCourseSections = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      if (course.type !== "prerecorded") {
        res.status(400).json({ error: "Course is not a prerecorded course" });
        return;
      }

      // Record view for authenticated users
      const studentId = req.body.ownerId ?? res.locals.ownerId;
      if (studentId) {
        const isPaid = course.couresSettings?.isPaid === true;
        const isFree = course.couresSettings?.isPaid === false;
        
        // Get current view count once
        const userViewCount = await this.courseService.getUserCourseViewCount(courseId, studentId);
        // Check view limit based on course type
        if (isFree && userViewCount >= 4) {
          res.status(403).json({ 
            error: "You have reached the maximum number of views (4) for this free course",
            viewsCount: userViewCount
          });
          return;
        }
        
        if (isPaid && userViewCount >= 16) {
          res.status(403).json({ 
            error: "You have reached the maximum number of views (16) for this paid course",
            viewsCount: userViewCount
          });
          return;
        }
        
        // Record the view (wrapped in try-catch to not fail the request if recording fails)
        try {
          await this.courseService.createCourseView(course, studentId);
        } catch (viewError) {
          // Log but don't fail the request if view recording fails
          req.log.warn({ err: viewError, courseId, studentId }, "Failed to record course view");
        }
      }

      const sections = await this.courseService.getPrerecordedCourseSections(
        courseId
      );
      
      // Transform materialLinks to materials for DTO
      const shapedSections = sections.map(session => ({
        ...session,
        lessons: session.lessons?.map((l: any) => ({
          ...l,
          materials: (l.materialLinks ?? []).filter((link: any) => link?.material),
        })),
      }));
      
      const sectionDtos = plainToInstance(RecordedSessionDto, shapedSections, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(sectionDtos);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getPrerecordedCourseSections failed");
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
      
      const { data: courses, total } = await this.courseService.searchCourses(
        courseType,
        page,
        limit,
        searchQuery
      );
      const courseDtos = await getCourseDto(courses, courseType);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(courseDtos);
      
    } catch (error) {
      req.log.error({ err: error, courseType: req.query.type, page: req.query.page, limit: req.query.limit, searchQuery: req.query.q }, "searchCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getOneOnOneSessionsByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.teacherId;
      if (teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const sessions = await this.courseService.getTeacherOneOnOneSessions(
        teacherId
      );
      const sessionDtos = plainToInstance(SessionDto, sessions, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(sessionDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.teacherId }, "getOneOnOneSessionsByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);

      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const ids = req.body.materials;
      await this.courseService.addMaterialsToCourse(courseId, ids);
      res.status(200).json({ message: "Materials added successfully" });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "addCourseMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const materials = await this.courseService.getCourseMaterials(courseId);
      const materialDtos = plainToInstance(MaterialDto, materials, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(materialDtos);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getCourseMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get lesson materials
  getLessonMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {lessonId} = req.params;
      const materials = await this.courseService.getLessonMaterials(lessonId);
      const materialDtos = plainToInstance(MaterialDto, materials, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(materialDtos);
    }
    catch (error) {
      req.log.error({ err: error, lessonId: req.params.lessonId }, "getLessonMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // remove lesson materials
  removeLessonMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {lessonId, id} = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const {materialIds} = req.body;
      await this.courseService.removeMaterialsFromLesson(lessonId, materialIds);
      res.status(200).json({ message: "Materials removed successfully" });
    }
    catch (error) {
      req.log.error({ err: error, lessonId: req.params.lessonId, id: req.params.id, materialIds: req.body?.materialIds }, "removeLessonMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // remove course materials
  removeCourseMaterials = async (req: Request, res: Response): Promise<void> => {
    try {
      const {id} = req.params;
      const {materialIds} = req.body;
      const course = await this.courseService.getCourseById(id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      await this.courseService.removeMaterialsFromCourse(id, materialIds);
      res.status(200).json({ message: "Materials removed successfully" });
    }
    catch (error) {
      req.log.error({ err: error, id: req.params.id, materialIds: req.body?.materialIds }, "removeCourseMaterials failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ALL course materials
  toggleCourseMaterialsShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const isSharableInput = req.body?.isSharable;
      const isSharable = isSharableInput === true || isSharableInput === "true" || isSharableInput === 1 || isSharableInput === "1";
      await this.courseService.setCourseMaterialsSharable(courseId, isSharable);
      res.status(200).json({ message: `Course materials ${isSharable ? "shared" : "unshared"} successfully` });
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id, isSharable: req.body?.isSharable }, "toggleCourseMaterialsShare failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ONE course material (auto-toggle)
  toggleCourseMaterialShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const materialId = req.params.materialId;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      if (course.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const newValue = await this.courseService.toggleCourseMaterialSharable(courseId, materialId);
      res.status(200).json({ 
        message: `Course material ${newValue ? "shared" : "unshared"} successfully`,
        isSharable: newValue
      });
    } catch (error: any) {
      if (error.message.includes("Material link not found")) {
        res.status(404).json({ error: "Material link not found" });
        return;
      }
      req.log.error({ err: error, courseId: req.params.id, materialId: req.params.materialId }, "toggleCourseMaterialShare failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ALL lesson materials (under a session)
  toggleLessonMaterialsShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const isSharableInput = req.body?.isSharable;
      const isSharable = isSharableInput === true || isSharableInput === "true" || isSharableInput === 1 || isSharableInput === "1";
      await this.courseService.setLessonMaterialsSharable(lessonId, isSharable);
      res.status(200).json({ message: `Lesson materials ${isSharable ? "shared" : "unshared"} successfully` });
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId, isSharable: req.body?.isSharable }, "toggleLessonMaterialsShare failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // Toggle share/unshare for ONE lesson material (auto-toggle)
  toggleLessonMaterialShare = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.id;
      const lessonId = req.params.lessonId;
      const materialId = req.params.materialId;
      
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      const materialLink = await this.courseService.getMaterialLinkByMaterialIdAndLessonId(materialId, lessonId);
      if (!materialLink) {
        res.status(404).json({ error: "Material link not found" });
        return;
      }
      materialLink.isSharable = !materialLink.isSharable;
      await this.courseService.updateMaterialLinkById(materialLink);
      const newValue = materialLink.isSharable;
      res.status(200).json({ 
        message: `Lesson material ${newValue ? "shared" : "unshared"} successfully`,
        isSharable: newValue
      });
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id, lessonId: req.params.lessonId, materialId: req.params.materialId }, "toggleLessonMaterialShare failed");
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
        const hasRequested = await this.courseService.studentRequestService.hasStudentRequestedCertificate(studentId, courseId);
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
          const requestDto = await enrichDto<StudentRequestDto>(StudentRequestDto, request);
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
      const requestDto = await enrichDto<StudentRequestDto>(StudentRequestDto, request);
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
