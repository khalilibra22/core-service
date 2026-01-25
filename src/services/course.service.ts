import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import { CertificateModel } from "../models/certificate.model";
import { CourseModel } from "../models/course.model";
import { CourseSettingsModel } from "../models/course-settings.model";
import { LessonModel } from "../models/lesson.model";
import { SessionModel } from "../models/session.model";
import { MaterialModel } from "../models/material.model";
import { MaterialLinkModel } from "../models/material-link.model";
import { StudentRequestModel } from "../models/student-request.model";
import { CourseViewModel } from "../models/course-view.model";
import { CourseProgressModel } from "../models/course-progress.model";
import { In, IsNull } from "typeorm";
import { StudentRequestService } from "./student-request.service";
import { PaginatedResult } from "../utils";

export class CourseService {
  courseRepo: any;
  courseSettingsRepo: any;
  sessionRepo: any;
  certificateRepo: any;
  lessonRepo: any;
  materialRepo: any;
  materialLinkRepo: any;
  courseViewRepo: any;
  courseProgressRepo: any;
  studentRequestService: StudentRequestService;
  constructor() {
    this.courseRepo = AppDataSource.getRepository(CourseModel);
    this.courseSettingsRepo = AppDataSource.getRepository(CourseSettingsModel);
    this.sessionRepo = AppDataSource.getRepository(SessionModel);
    this.certificateRepo = AppDataSource.getRepository(CertificateModel);
    this.lessonRepo = AppDataSource.getRepository(LessonModel);
    this.materialRepo = AppDataSource.getRepository(MaterialModel);
    this.materialLinkRepo = AppDataSource.getRepository(MaterialLinkModel);
    this.courseViewRepo = AppDataSource.getRepository(CourseViewModel);
    this.courseProgressRepo = AppDataSource.getRepository(CourseProgressModel);
    this.studentRequestService = new StudentRequestService();
  }

  async createCourse(course: CourseModel): Promise<CourseModel> {
    try {
      return await this.courseRepo.save(course);
    } catch (error) {
      logger.error({ err: error }, "createCourse failed");
      throw new Error("Error creating course");
    }
  }

  // create course settings
  async createCourseSettings(
    courseSettings: CourseSettingsModel
  ): Promise<CourseSettingsModel> {
    try {
      return await this.courseSettingsRepo.save(courseSettings);
    } catch (error) {
      logger.error({ err: error }, "createCourseSettings failed");
      throw new Error("Error creating course settings");
    }
  }

  // get course by id
  async getCourseById(id: string): Promise<CourseModel | null> {
    try {
      return await this.courseRepo.findOne({
        where: {
          id: id,
        },
        relations: ["couresSettings", "enrollments", "sessions"],
        cache: {
          id: `course-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error: any) {
      logger.error({ err: error, id }, "getCourseById failed");
      throw new Error("Error fetching course by ID : " + error.message);
    }
  }

  async getCourseByIdNoCache(id: string): Promise<CourseModel | null> {
    try {
      return await this.courseRepo.findOne({
        where: {
          id: id,
        },
        relations: ["couresSettings", "enrollments", "sessions", "sessions.lessons", "sessions.quizzes"],
        cache: false,
      });
    } catch (error: any) {
      logger.error({ err: error, id }, "getCourseByIdNoCache failed");
      throw new Error("Error fetching course by ID : " + error.message);
    }
  }



  // update course
  async updateCourse(course: CourseModel): Promise<CourseModel> {
    try {
      return await this.courseRepo.save(course);
    } catch (error) {
      logger.error({ err: error }, "updateCourse failed");
      throw new Error("Error updating course");
    }
  }

  // get course by id with enrollments
  async getCourseByIdWithEnrollments(id: string): Promise<CourseModel | null> {
    try {
      return await this.courseRepo.findOne({
        where: {
          id: id,
        },
        relations: ["enrollments", "couresSettings"],
        cache: false,
        // cache: {
        //   id: `course-enrollments-${id}`,
        //   milliseconds: 300000, // 5 minutes
        // },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getCourseByIdWithEnrollments failed");
      throw new Error("Error fetching course by ID with enrollments");
    }
  }

  //getCoursesByTeacherId
  async getCoursesByTeacherId(
    teacherId: string,
    type: string,
    page: number,
    limit: number
  ): Promise<PaginatedResult<CourseModel>> {
    try {
      const [data, total] = await this.courseRepo.findAndCount({
        where: {
          ownerId: teacherId,
          type: type,
        },
        relations: ["couresSettings", "enrollments", "sessions"],
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `teacher-courses-${teacherId}-${type}-${page}-${limit}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return { data, total };
    } catch (error) {
      logger.error({ err: error, teacherId, type, page, limit }, "getCoursesByTeacherId failed");
      throw new Error("Error fetching courses by teacher ID");
    }
  }

  //get all courses of type live using pagination
  async getAllLiveCourses(page: number, limit: number): Promise<PaginatedResult<CourseModel>> {
    try {
      const [data, total] = await this.courseRepo.findAndCount({
        where: {
          type: "live",
        },
        relations: ["couresSettings", "enrollments"],
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `live-courses-${page}-${limit}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return { data, total };
    } catch (error) {
      logger.error({ err: error, page, limit }, "getAllLiveCourses failed");
      throw new Error("Error fetching all courses of type live");
    }
  }

  async getAllGroupCourses(
    page: number,
    limit: number
  ): Promise<PaginatedResult<CourseModel>> {
    try {
      const [data, total] = await this.courseRepo.findAndCount({
        where: {
          type: "group",
        },
        relations: ["couresSettings", "enrollments"],
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `group-courses-${page}-${limit}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return { data, total };
    } catch (error) {
      logger.error({ err: error, page, limit }, "getAllGroupCourses failed");
      throw new Error("Error fetching all courses of type group");
    }
  }

  //get all courses of type prerecorded using pagination
  async getAllPrerecordedCourses(
    page: number,
    limit: number
  ): Promise<PaginatedResult<CourseModel>> {
    try {
      const [data, total] = await this.courseRepo.findAndCount({
        where: {
          type: "prerecorded",
        },
        relations: ["couresSettings", "enrollments", "sessions"],
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `prerecorded-courses-${page}-${limit}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return { data, total };
    } catch (error) {
      logger.error({ err: error, page, limit }, "getAllPrerecordedCourses failed");
      throw new Error("Error fetching all courses of type prerecorded");
    }
  }



  async deleteCourse(id: string): Promise<void> {
    try {
      await this.courseRepo.softDelete(id);
    } catch (error: any) {
      logger.error({ err: error, id }, "deleteCourse failed");
      throw new Error("Error deleting course");
    }
  }

  // create lesson
  async createLesson(lesson: LessonModel): Promise<LessonModel> {
    try {
      return await this.lessonRepo.save(lesson);
    } catch (error: any) {
      logger.error({ err: error }, "createLesson failed");
      throw new Error("Error creating lesson: " + error.message);
    }
  }

  // get lesson by id
  async getLessonById(id: string): Promise<LessonModel | null> {
    try {
      return await this.lessonRepo.findOne({
        where: {
          id: id,
        },
        cache: {
          id: `lesson-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error: any) {
      logger.error({ err: error, id }, "getLessonById failed");
      throw new Error("Error fetching lesson by ID: " + error.message);
    }
  }

  // get lessons by session id
  async getLessonsBySessionId(sessionId: string): Promise<LessonModel[]> {
    try {
      return await this.lessonRepo.find({
        where: {
          session: {
            id: sessionId,
          },
        },
        relations: ["materialLinks", "materialLinks.material"],
        cache: {
          id: `session-lessons-${sessionId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error: any) {
      logger.error({ err: error, sessionId }, "getLessonsBySessionId failed");
      throw new Error("Error fetching lessons by session ID: " + error.message);
    }
  }

  // update lesson
  async updateLesson(lesson: LessonModel): Promise<LessonModel> {
    try {
      return await this.lessonRepo.save(lesson);
    } catch (error: any) {
      logger.error({ err: error }, "updateLesson failed");
      throw new Error("Error updating lesson: " + error.message);
    }
  }

  // delete lesson
  async deleteLesson(id: string): Promise<void> {
    try {
      await this.lessonRepo.softDelete(id);
    } catch (error: any) {
      logger.error({ err: error, id }, "deleteLesson failed");
      throw new Error("Error deleting lesson: " + error.message);
    }
  }



  async searchCourses(
    type: string,
    page: number,
    limit: number,
    searchQuery?: string,
    filters?: {
      level?: string;
      topicId?: number;
      minPrice?: number;
      maxPrice?: number;
      isCertified?: boolean;
      minDuration?: number;
      maxDuration?: number;
      minRating?: number;
      isRemote?: boolean;
      isAcademy?: boolean;
      language?: string;
      subjectId?: number;
      startDate?: Date;
    }
  ): Promise<PaginatedResult<CourseModel>> {
    try {
      const skip = (page - 1) * limit;

      const query = this.courseRepo
        .createQueryBuilder("course")
        .leftJoinAndSelect("course.couresSettings", "couresSettings")
        .leftJoinAndSelect("course.enrollments", "enrollments")
        .leftJoinAndSelect("course.sessions", "sessions")
        .where("course.type = :type", { type })
        .andWhere("course.deletedAt IS NULL");

      // Apply text search if provided
      if (searchQuery && searchQuery.trim() !== "") {
        const terms = searchQuery.trim().split(/\s+/).filter(t => t.length > 0);
        // Support both stemming (exact word) and prefix matching (partial word)
        // for each term: "(word | word:*)"
        // Joining terms with "&" for AND logic
        const formattedQuery = terms.map(t => {
          // Escape special characters for tsquery
          const escaped = t.replace(/[:&|!()*]/g, '');
          return escaped ? `(${escaped} | ${escaped}:*)` : '';
        }).filter(Boolean).join(" & ");

        if (formattedQuery) {
          const vectorContent = `
            coalesce("course"."name", '') || ' ' || 
            coalesce("course"."description", '') || ' ' || 
            coalesce("course"."language", '') || ' ' || 
            coalesce("couresSettings"."syllabus", '') || ' ' || 
            coalesce("couresSettings"."grade", '')
          `;

          query.andWhere(
            `(to_tsvector('arabic', ${vectorContent}) @@ to_tsquery('arabic', :searchQuery) OR 
              to_tsvector('english', ${vectorContent}) @@ to_tsquery('english', :searchQuery))`,
            { searchQuery: formattedQuery }
          );
        }
      }

      // Apply filters
      if (filters) {
        if (filters.level) {
          query.andWhere("couresSettings.grade = :level", { level: filters.level });
        }
        if (filters.topicId) {
          query.andWhere("couresSettings.topicId = :topicId", { topicId: filters.topicId });
        }
        if (filters.minPrice !== undefined) {
          query.andWhere("course.sellingPrice >= :minPrice", { minPrice: filters.minPrice });
        }
        if (filters.maxPrice !== undefined) {
          query.andWhere("course.sellingPrice <= :maxPrice", { maxPrice: filters.maxPrice });
        }
        if (filters.isCertified !== undefined) {
          query.andWhere("couresSettings.isCertified = :isCertified", { isCertified: filters.isCertified });
        }
        if (filters.minDuration !== undefined) {
          query.andWhere("course.duration >= :minDuration", { minDuration: filters.minDuration });
        }
        if (filters.maxDuration !== undefined) {
          query.andWhere("course.duration <= :maxDuration", { maxDuration: filters.maxDuration });
        }
        if (filters.minRating !== undefined) {
          query.andWhere("course.rating >= :minRating", { minRating: filters.minRating });
        }
        if (filters.isRemote !== undefined) {
          query.andWhere("course.isRemote = :isRemote", { isRemote: filters.isRemote });
        }
        if (filters.isAcademy !== undefined) {
          if (filters.isAcademy) {
            query.andWhere("course.instructorId IS NOT NULL");
          } else {
            query.andWhere("course.instructorId IS NULL");
          }
        }
        if (filters.language) {
          query.andWhere("course.language = :language", { language: filters.language });
        }
        if (filters.subjectId) {
          query.andWhere("course.subjectId = :subjectId", { subjectId: filters.subjectId });
        }
        if (filters.startDate) {
          // Filter courses where the FIRST session date is >= startDate
          // We use a subquery to find courses that satisfy the condition
          query.andWhere((qb: any) => {
            const subQuery = qb
              .subQuery()
              .select("s.courseId")
              .from(SessionModel, "s")
              .groupBy("s.courseId")
              .having("MIN(s.date) >= :startDate")
              .getQuery();
            return `course.id IN ${subQuery}`;
          }, { startDate: filters.startDate });
        }
      }

      query
        .orderBy("course.createdAt", "DESC")
        .skip(skip)
        .take(limit);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error: any) {
      logger.error({ err: error, type, page, limit, searchQuery, filters }, "searchCourses failed");
      throw new Error("Error fetching courses: " + error.message);
    }
  }



  // get student enrolled courses by student id
  async getStudentEnrolledCourses(studentId: string, page: number, limit: number, courseType: string): Promise<PaginatedResult<CourseModel>> {
    try {
      const skip = (page - 1) * limit;
      const query = this.courseRepo
        .createQueryBuilder("course")
        .innerJoin(
          "course.enrollments",
          "enrollment",
          "enrollment.studentId = :studentId AND enrollment.type = :enrollmentType"
        )
        .where("course.type = :courseType")
        .setParameters({
          studentId,
          enrollmentType: "course",
          courseType,
        })
        .leftJoinAndSelect("course.couresSettings", "couresSettings")
        .leftJoinAndSelect("course.sessions", "sessions")
        .leftJoinAndSelect("course.enrollments", "enrollments")
        .orderBy("course.createdAt", "DESC")
        .skip(skip)
        .take(limit);

      const [data, total] = await query.getManyAndCount();
      return { data, total };
    } catch (error: any) {
      logger.error({ err: error, studentId, page, limit, courseType }, "getStudentEnrolledCourses failed");
      throw new Error("Error fetching student enrolled courses: " + error.message);
    }
  }

  // Student Request Methods
  async createStudentRequest(
    courseId: string,
    studentId: string,
    type: string,
    message?: string,
    payload?: any
  ): Promise<StudentRequestModel> {
    try {
      const course = await this.getCourseById(courseId);
      if (!course) {
        throw new Error("Course not found");
      }
      const requestBody: StudentRequestModel = {
        studentId,
        type,
        message,
        payload,
        status: "pending",
        course,
      };
      return await this.studentRequestService.createStudentRequest(requestBody);
    } catch (error: any) {
      logger.error({ err: error, courseId, studentId, type }, "createStudentRequest failed");
      throw new Error("Error creating student request: " + error.message);
    }
  }

  async updateStudentRequestStatus(
    requestId: string,
    status: string,
    ownerResponse?: string,
    respondedBy?: string
  ): Promise<StudentRequestModel> {
    try {
      const request = await this.studentRequestService.getStudentRequestById(requestId);
      if (!request) {
        throw new Error("Student request not found");
      }
      request.status = status;
      if (ownerResponse) {
        request.ownerResponse = ownerResponse;
      }
      if (respondedBy) {
        request.respondedBy = respondedBy;
        request.respondedAt = new Date();
      }
      return await this.studentRequestService.updateStudentRequest(request);
    } catch (error: any) {
      logger.error({ err: error, requestId, status }, "updateStudentRequestStatus failed");
      throw new Error("Error updating student request status: " + error.message);
    }
  }

  async getStudentRequestsByCourseId(courseId: string): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestService.getStudentRequestsByCourseId(courseId);
    } catch (error: any) {
      logger.error({ err: error, courseId }, "getStudentRequestsByCourseId failed");
      throw new Error("Error fetching student requests: " + error.message);
    }
  }

  async getStudentRequestsByOwnerId(ownerId: string, page: number = 1, limit: number = 10): Promise<{ data: StudentRequestModel[]; total: number }> {
    try {
      return await this.studentRequestService.getStudentRequestsByOwnerId(ownerId, page, limit);
    } catch (error: any) {
      logger.error({ err: error, ownerId }, "getStudentRequestsByOwnerId failed");
      throw new Error("Error fetching student requests: " + error.message);
    }
  }

  async getStudentRequestById(requestId: string): Promise<StudentRequestModel | null> {
    try {
      return await this.studentRequestService.getStudentRequestById(requestId);
    } catch (error: any) {
      logger.error({ err: error, requestId }, "getStudentRequestById failed");
      throw new Error("Error fetching student request: " + error.message);
    }
  }

  // Course View Methods
  async createCourseView(course: CourseModel, studentId: string): Promise<CourseViewModel> {
    try {
      const view = this.courseViewRepo.create({
        course: course,
        studentId: studentId,
      });
      return await this.courseViewRepo.save(view);
    } catch (error: any) {
      logger.error({ err: error, courseId: course.id, studentId }, "createCourseView failed");
      throw new Error("Error creating course view: " + error.message);
    }
  }

  async getCourseViewCount(courseId: string): Promise<number> {
    try {
      return await this.courseViewRepo.count({
        where: {
          course: { id: courseId },
        },
      });
    } catch (error: any) {
      logger.error({ err: error, courseId }, "getCourseViewCount failed");
      throw new Error("Error fetching course view count: " + error.message);
    }
  }

  async getUserCourseViewCount(courseId: string, studentId: string): Promise<number> {
    try {
      return await this.courseViewRepo.count({
        where: {
          course: { id: courseId },
          studentId: studentId,
        },
      });
    } catch (error: any) {
      logger.error({ err: error, courseId, studentId }, "getUserCourseViewCount failed");
      throw new Error("Error fetching user course view count: " + error.message);
    }
  }

  // Course Progress Methods
  async getCourseProgress(courseId: string, studentId: string): Promise<CourseProgressModel | null> {
    try {
      return await this.courseProgressRepo.findOne({
        where: {
          course: { id: courseId },
          studentId: studentId,
        },
        relations: ["course", "lastSession", "lastLesson"],
      });
    } catch (error: any) {
      logger.error({ err: error, courseId, studentId }, "getCourseProgress failed");
      throw new Error("Error fetching course progress: " + error.message);
    }
  }

  async upsertCourseProgress(
    courseId: string,
    studentId: string,
    percentComplete?: number,
    lastSessionId?: string,
    lastLessonId?: string
  ): Promise<CourseProgressModel> {
    try {
      // Find existing progress
      let progress = await this.courseProgressRepo.findOne({
        where: {
          course: { id: courseId },
          studentId: studentId,
        },
      });

      const course = await this.courseRepo.findOne({ where: { id: courseId } });
      if (!course) {
        throw new Error("Course not found");
      }

      // Fetch related entities if IDs are provided
      let lastSession = undefined;
      let lastLesson = undefined;

      if (lastSessionId) {
        lastSession = await this.sessionRepo.findOne({ where: { id: lastSessionId } });
      }

      if (lastLessonId) {
        lastLesson = await this.lessonRepo.findOne({ where: { id: lastLessonId } });
      }

      if (progress) {
        // Update existing progress
        if (percentComplete !== undefined) {
          progress.percentComplete = percentComplete;
        }
        if (lastSession) {
          progress.lastSession = lastSession;
        }
        if (lastLesson) {
          progress.lastLesson = lastLesson;
        }
      } else {
        // Create new progress
        progress = this.courseProgressRepo.create({
          course,
          studentId,
          percentComplete: percentComplete ?? 0,
          lastSession,
          lastLesson,
        });
      }

      return await this.courseProgressRepo.save(progress);
    } catch (error: any) {
      logger.error({ err: error, courseId, studentId }, "upsertCourseProgress failed");
      throw new Error("Error upserting course progress: " + error.message);
    }
  }

  async getCourseProgressSummary(courseId: string, studentId: string): Promise<any> {
    try {
      const progress = await this.getCourseProgress(courseId, studentId);

      if (!progress) {
        return {
          percentComplete: 0,
          lastSessionId: null,
          lastLessonId: null,
          lastUpdated: null,
        };
      }

      return {
        percentComplete: progress.percentComplete ?? 0,
        lastSessionId: progress.lastSession?.id ?? null,
        lastLessonId: progress.lastLesson?.id ?? null,
        lastUpdated: progress.updatedAt,
      };
    } catch (error: any) {
      logger.error({ err: error, courseId, studentId }, "getCourseProgressSummary failed");
      throw new Error("Error fetching course progress summary: " + error.message);
    }
  }

  async getCourseStudentRequestSummary(courseId: string): Promise<{ last24hCount: number; last24hPendingCount: number }> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Count all requests in last 24 hours
      const last24hCount = await AppDataSource.getRepository(StudentRequestModel)
        .createQueryBuilder("sr")
        .where("sr.courseId = :courseId", { courseId })
        .andWhere("sr.createdAt > :cutoffTime", { cutoffTime })
        .andWhere("sr.deletedAt IS NULL")
        .getCount();

      // Count pending requests in last 24 hours
      const last24hPendingCount = await AppDataSource.getRepository(StudentRequestModel)
        .createQueryBuilder("sr")
        .where("sr.courseId = :courseId", { courseId })
        .andWhere("sr.createdAt > :cutoffTime", { cutoffTime })
        .andWhere("sr.status = :status", { status: "pending" })
        .andWhere("sr.deletedAt IS NULL")
        .getCount();

      return {
        last24hCount,
        last24hPendingCount,
      };
    } catch (error: any) {
      logger.error({ err: error, courseId }, "getCourseStudentRequestSummary failed");
      throw new Error("Error fetching course student request summary: " + error.message);
    }
  }

}
