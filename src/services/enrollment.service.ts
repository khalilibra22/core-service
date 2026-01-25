import { In, Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { publish } from "../events";
import { CACHE_KEYS, CACHE_TTL } from "../config/constants";

export class EnrollmentService {
  private enrollmentRepo: Repository<EnrollmentModel>;

  constructor(repo?: Repository<EnrollmentModel>) {
    this.enrollmentRepo = repo || AppDataSource.getRepository(EnrollmentModel);
  }

  async createEnrollment(
    enrollment: EnrollmentModel,
    fcmToken?: string
  ): Promise<EnrollmentModel> {
    try {
      const savedEnrollment = await this.enrollmentRepo.save(enrollment);

      // Publish enrollment.created event for course enrollments
      if (savedEnrollment.type === "course" && savedEnrollment.course?.id) {
        await publish("enrollment.created", {
          courseId: savedEnrollment.course.id as string,
          userId: savedEnrollment.studentId as string,
          enrollmentId: savedEnrollment.id as string,
          courseTitle: savedEnrollment.course.name as string,
          fcmToken,
        });
      }

      return savedEnrollment;
    } catch (error) {
      logger.error({ err: error }, "createEnrollment failed");
      throw new Error("Error creating course enrollment");
    }
  }

  async getCourseEnrollments(courseId: string): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: { course: { id: courseId }, type: "course" },
        relations: ["course"],
        cache: {
          id: CACHE_KEYS.COURSE_ENROLLMENTS(courseId),
          milliseconds: CACHE_TTL.STATIC_CONTENT,
        },
      });
    } catch (error) {
      logger.error({ err: error, courseId }, "getCourseEnrollments failed");
      throw new Error("Error fetching course enrollments");
    }
  }

  async getOneOnOneEnrollmentByTeacherId(
    teacherId: string
  ): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: {
          teacherId: teacherId,
          type: "one-on-one",
        },
        relations: ["sessions", "materialLinks", "materialLinks.material"],
        cache: {
          id: CACHE_KEYS.TEACHER_ONE_ON_ONE_ENROLLMENTS(teacherId),
          milliseconds: CACHE_TTL.STATIC_CONTENT,
        },
      });
    } catch (error) {
      logger.error({ err: error, teacherId }, "getOneOnOneEnrollmentByTeacherId failed");
      throw new Error("Error fetching session enrollments");
    }
  }

  async updateEnrollment(
    enrollment: EnrollmentModel
  ): Promise<EnrollmentModel> {
    try {
      return await this.enrollmentRepo.save(enrollment);
    } catch (error) {
      logger.error({ err: error }, "updateEnrollment failed");
      throw new Error("Error creating course enrollment");
    }
  }

  async getEnrollmentById(
    enrollmentId: string
  ): Promise<EnrollmentModel | null> {
    try {
      return await this.enrollmentRepo.findOne({
        where: {
          id: enrollmentId,
        },
        cache: {
          id: CACHE_KEYS.ENROLLMENT(enrollmentId),
          milliseconds: CACHE_TTL.STATIC_CONTENT,
        },
      });
    } catch (error) {
      logger.error({ err: error, enrollmentId }, "getEnrollmentById failed");
      throw new Error("Error fetching course enrollment by ID");
    }
  }

  //get student ernollments by student id
  async getStudentCoursesEnrollments(
    studentId: string
  ): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: {
          studentId: studentId,
          type: "course",
          course: { type: In(["live", "group", "prerecorded"]) },
        },
        relations: ["course", "course.couresSettings", "course.sessions"], //group by createdAt , newest first
        order: { createdAt: "DESC" },
        cache: {
          id: CACHE_KEYS.STUDENT_COURSE_ENROLLMENTS(studentId),
          milliseconds: CACHE_TTL.STATIC_CONTENT,
        },
      });
    } catch (error) {
      logger.error({ err: error, studentId }, "getStudentCoursesEnrollments failed");
      throw new Error("Error fetching student enrollments");
    }
  }

  async getStudentOneOnOneEnrollments(
    studentId: string
  ): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: { studentId: studentId, type: "one-on-one" },
        relations: ["sessions", "materialLinks", "materialLinks.material"],
        order: { createdAt: "DESC" },
        cache: {
          id: CACHE_KEYS.STUDENT_ONE_ON_ONE_ENROLLMENTS(studentId),
          milliseconds: CACHE_TTL.STATIC_CONTENT,
        },
      });
    } catch (error) {
      logger.error({ err: error, studentId }, "getStudentOneOnOneEnrollments failed");
      throw new Error("Error fetching student one-on-one enrollments");
    }
  }

  async getEnrollmentWithMaterials(
    enrollmentId: string
  ): Promise<EnrollmentModel | null> {
    try {
      return await this.enrollmentRepo.findOne({
        where: { id: enrollmentId },
        relations: [
          "materialLinks",
          "materialLinks.material",
        ],
      });
    } catch (error) {
      logger.error({ err: error, enrollmentId }, "getEnrollmentWithMaterials failed");
      throw new Error("Error fetching enrollment with materials");
    }
  }
}
