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

  async createCourseSession(session: SessionModel): Promise<SessionModel> {
    try {
      return await this.sessionRepo.save(session);
    } catch (error: any) {
      logger.error({ err: error }, "createCourseSession failed");
      throw new Error("Error creating course session: " + error.message);
    }
  }

  async getSessionById(id: string): Promise<SessionModel | null> {
    try {
      return await this.sessionRepo.findOne({
        where: {
          id: id,
        },
        relations: ["course", "enrollment"],
        cache: {
          id: `session-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getSessionById failed");
      throw new Error("Error fetching session by ID");
    }
  }

  async updateSession(session: SessionModel): Promise<SessionModel> {
    try {
      return await this.sessionRepo.save(session);
    } catch (error: any) {
      logger.error({ err: error }, "updateSession failed");
      throw new Error("Error updating session: " + error.message);
    }
  }

  async createCertificate(
    certificate: CertificateModel
  ): Promise<CertificateModel> {
    try {
      return await this.certificateRepo.save(certificate);
    } catch (error) {
      throw new Error("Error creating certificate");
    }
  }

  // get course sessions by course id
  async getCourseSessions(courseId: string): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          course: {
            id: courseId,
          },
        },
        cache: {
          id: `course-sessions-${courseId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, courseId }, "getCourseSessions failed");
      throw new Error("Error fetching course sessions");
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

  async deleteSession(id: string): Promise<void> {
    try {
      await this.sessionRepo.softDelete(id);
    } catch (error: any) {
      logger.error({ err: error, id }, "deleteSession failed");
      throw new Error("Error deleting session");
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

  // get prerecorded session details by id with lessons and quizzes
  async getPrerecordedSessionDetails(id: string): Promise<SessionModel | null> {
    try {
      return await this.sessionRepo.findOne({
        where: {
          id: id,
        },
        relations: ["lessons", "lessons.materialLinks", "lessons.materialLinks.material", "quizzes", "course"],
        cache: {
          id: `prerecorded-session-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error: any) {
      logger.error({ err: error, id }, "getPrerecordedSessionDetails failed");
      throw new Error(
        "Error fetching prerecorded session details: " + error.message
      );
    }
  }

  // get prerecorded course by id with sessions and sessions lessons and quizzes
  async getPrerecordedCourseSections(id: string): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          course: {
            id: id,
          },
        },
        relations: ["lessons", "lessons.materialLinks", "lessons.materialLinks.material", "quizzes"],
        cache: {
          id: `prerecorded-course-sections-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error: any) {
      logger.error({ err: error, id }, "getPrerecordedCourseSections failed");
      throw new Error(
        "Error fetching prerecorded course sections: " + error.message
      );
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

  async getTeacherOneOnOneSessions(teacherId: string): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          enrollment: {
            teacherId: teacherId,
          },
        },
        cache: {
          id: `teacher-one-on-one-sessions-${teacherId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      throw new Error("Error fetching one on one sessions by teacher ID");
    }
  }

  async getOneOnOneSessionsByEnrollmentId(
    enrollmentId: string
  ): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          enrollment: {
            id: enrollmentId,
          },
        },
        cache: {
          id: `enrollment-sessions-${enrollmentId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      throw new Error("Error fetching one on one sessions by teacher ID");
    }
  }

  async getCourseMaterials(id: string): Promise<MaterialLinkModel[]> {
    try {
      const links = await this.materialLinkRepo.find({
        where: { course: { id } },
        relations: ["material"],
        cache: false,
        // cache: {
        //   id: `course-materials-${id}`,
        //   milliseconds: 300000,
        // },
      });
      return links;
    } catch (error: any) {
      logger.error({ err: error, id }, "getCourseMaterials failed");
      throw new Error(
        "Error fetching course materials by ID : " + error.message
      );
    }
  }

  async getLessonMaterials(id: string): Promise<MaterialLinkModel[]> {
    try {
      const links = await this.materialLinkRepo.find({
        where: { lesson: { id } },
        relations: ["material"],
        cache: false,
        // cache: {
        //   id: `course-materials-${id}`,
        //   milliseconds: 300000,
        // },
      });
      return links;
    } catch (error: any) {
      logger.error({ err: error, id }, "getLessonMaterials failed");
      throw new Error(
        "Error fetching course materials by ID : " + error.message
      );
    }
  }

  async findMaterialsByIds(ids: string[]): Promise<MaterialModel[]> {
    try {
      if (!ids?.length) return [];
      return await this.materialRepo.find({
        where: { id: In(ids) },
      });
    } catch (error: any) {
      throw new Error("Error fetching materials: " + error.message);
    }
  }

  async addMaterialsToCourse(
    courseId: string,
    materialIds: string[]
  ): Promise<void> {
    try {
      if (!materialIds?.length) return;

      // Check for existing links (including soft-deleted ones)
      const existingLinks = await this.materialLinkRepo.find({
        where: {
          course: { id: courseId },
          material: { id: In(materialIds) },
        },
        relations: ["material"],
        //withDeleted: true, // Include soft-deleted records
      });

      // Filter out materials that are already linked (not soft-deleted)
      const activeLinkIds = existingLinks
        .filter((link: any) => !link.deletedAt)
        .map((link: any) => link.material?.id)
        .filter(Boolean);

      const newMaterialIds = materialIds.filter(
        (id) => !activeLinkIds.includes(id)
      );

      if (newMaterialIds.length === 0) return; // All materials already linked

      const materials = await this.materialRepo.find({
        where: { id: In(newMaterialIds) },
      });
      const course = await this.courseRepo.findOne({
        where: { id: courseId },
      });

      const links = materials.map((m: any) =>
        this.materialLinkRepo.create({ course, material: m })
      );
      await this.materialLinkRepo.save(links);
    } catch (error: any) {
      throw new Error("Error adding materials to course: " + error.message);
    }
  }

  async addMaterialsToLesson(
    lessonId: string,
    materialIds: string[]
  ): Promise<void> {
    try {
      if (!materialIds?.length) return;

      // Bulk insert with ON CONFLICT DO NOTHING - efficient, no pre-read needed
      // The partial unique index ensures no duplicate active links
      await this.materialLinkRepo
        .createQueryBuilder()
        .insert()
        .into(MaterialLinkModel)
        .values(
          materialIds.map((materialId) => ({
            lesson: { id: lessonId },
            material: { id: materialId },
          }))
        )
        .orIgnore() // ON CONFLICT DO NOTHING
        .execute();
    } catch (error: any) {
      throw new Error("Error adding materials to lesson: " + error.message);
    }
  }

  //removeMaterialsFromLesson(lessonId, materialIds)
  async removeMaterialsFromLesson(lessonId: string, materialIds: string[]): Promise<void> {
    try {
      // Use softDelete with find for better reliability
      const linksToDelete = await this.materialLinkRepo.find({
        where: {
          lesson: { id: lessonId },
          material: { id: In(materialIds) },
        },
      });

      if (linksToDelete.length > 0) {
        const linkIds = linksToDelete.map((link: any) => link.id);
        await this.materialLinkRepo.softDelete(linkIds);
      }
    } catch (error: any) {
      throw new Error("Error removing materials from lesson: " + error.message);
    }
  }

  // Update lesson materials (replaces all materials)
  async updateLessonMaterials(lessonId: string, materialIds: string[]): Promise<void> {
    try {
      // Efficient set-based approach: single lightweight query for current IDs
      const rows = await this.materialLinkRepo
        .createQueryBuilder("ml")
        .select("ml.materialId", "materialId")
        .where("ml.lessonId = :lessonId", { lessonId })
        .andWhere("ml.deleted_at IS NULL")
        .getRawMany();

      const current = new Set<string>(rows.map((r: any) => r.materialId as string));
      const desired = new Set<string>(materialIds ?? []);

      // Compute diff in memory
      const toRemove = Array.from(current).filter((id) => !desired.has(id));
      const toAdd = Array.from(desired).filter((id) => !current.has(id));

      // Bulk soft-delete removals
      if (toRemove.length > 0) {
        await this.materialLinkRepo
          .createQueryBuilder()
          .softDelete()
          .where("lessonId = :lessonId", { lessonId })
          .andWhere("materialId IN (:...ids)", { ids: toRemove })
          .andWhere("deleted_at IS NULL")
          .execute();
      }

      // Bulk insert additions with orIgnore
      if (toAdd.length > 0) {
        await this.materialLinkRepo
          .createQueryBuilder()
          .insert()
          .into(MaterialLinkModel)
          .values(
            toAdd.map((materialId) => ({
              lesson: { id: lessonId },
              material: { id: materialId },
            }))
          )
          .orIgnore()
          .execute();
      }
    } catch (error: any) {
      throw new Error("Error updating lesson materials: " + error.message);
    }
  }
  //removeMaterialsFromCourse(courseId, materialIds); soft delete the material links by updating deletedAt in a single query
  async removeMaterialsFromCourse(courseId: string, materialIds: string[]): Promise<void> {
    try {
      // Use softDelete with find for better reliability
      const linksToDelete = await this.materialLinkRepo.find({
        where: {
          course: { id: courseId },
          material: { id: In(materialIds) },
        },
      });

      if (linksToDelete.length > 0) {
        const linkIds = linksToDelete.map((link: any) => link.id);
        await this.materialLinkRepo.softDelete(linkIds);
      }
    } catch (error: any) {
      throw new Error("Error removing materials from course: " + error.message);
    }
  }

  // Toggle share/unshare all course materials
  async setCourseMaterialsSharable(courseId: string, isSharable: boolean): Promise<void> {
    try {
      await this.materialLinkRepo
        .createQueryBuilder()
        .update()
        .set({ isSharable })
        .where("courseId = :courseId", { courseId })
        .andWhere("deleted_at IS NULL")
        .execute();
    } catch (error: any) {
      throw new Error("Error toggling course materials share: " + error.message);
    }
  }

  // Toggle share/unshare one course material (auto-toggle current value)
  async toggleCourseMaterialSharable(courseId: string, materialId: string): Promise<boolean> {
    try {
      // Find the current link
      const link = await this.materialLinkRepo.findOne({
        where: {
          course: { id: courseId },
          material: { id: materialId },
          deletedAt: IsNull(),
        },
      });

      if (!link) {
        throw new Error("Material link not found");
      }

      const newValue = !link.isSharable;

      await this.materialLinkRepo
        .createQueryBuilder()
        .update()
        .set({ isSharable: newValue })
        .where("courseId = :courseId", { courseId })
        .andWhere("materialId = :materialId", { materialId })
        .andWhere("deleted_at IS NULL")
        .execute();

      return newValue;
    } catch (error: any) {
      throw new Error("Error toggling course material share: " + error.message);
    }
  }

  // Toggle share/unshare all lesson materials
  async setLessonMaterialsSharable(lessonId: string, isSharable: boolean): Promise<void> {
    try {
      await this.materialLinkRepo
        .createQueryBuilder()
        .update()
        .set({ isSharable })
        .where("lessonId = :lessonId", { lessonId })
        .andWhere("deleted_at IS NULL")
        .execute();
    } catch (error: any) {
      throw new Error("Error toggling lesson materials share: " + error.message);
    }
  }

  // Toggle share/unshare one lesson material (auto-toggle current value)
  async toggleLessonMaterialSharable(lessonId: string, materialId: string): Promise<boolean> {
    try {
      // Find the current link
      const link = await this.materialLinkRepo.findOne({
        where: {
          lesson: { id: lessonId },
          material: { id: materialId },
          deletedAt: IsNull(),
        },
      });

      if (!link) {
        throw new Error("Material link not found");
      }

      const newValue = !link.isSharable;

      await this.materialLinkRepo
        .createQueryBuilder()
        .update()
        .set({ isSharable: newValue })
        .where("lessonId = :lessonId", { lessonId })
        .andWhere("materialId = :materialId", { materialId })
        .andWhere("deleted_at IS NULL")
        .execute();

      return newValue;
    } catch (error: any) {
      throw new Error("Error toggling lesson material share: " + error.message);
    }
  }

  // get material link by material id and lesson id
  async getMaterialLinkByMaterialIdAndLessonId(materialId: string, lessonId: string): Promise<MaterialLinkModel | null> {
    try {
      // Query using direct FK columns - this is the correct approach for TypeORM
      const materialLink = await this.materialLinkRepo
        .createQueryBuilder("ml")
        .where("ml.materialId = :materialId", { materialId })
        .andWhere("ml.lessonId = :lessonId", { lessonId })
        .andWhere("ml.deleted_at IS NULL")
        .getOne();

      return materialLink;
    } catch (error: any) {
      throw new Error("Error fetching material link by material id and lesson id: " + error.message);
    }
  }

  // update material link by id
  async updateMaterialLinkById(materialLink: MaterialLinkModel): Promise<MaterialLinkModel> {
    try {
      return await this.materialLinkRepo.save(materialLink);
    } catch (error: any) {
      throw new Error("Error updating material link by id: " + error.message);
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
