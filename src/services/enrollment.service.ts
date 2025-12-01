import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { publish } from "../events";

export class EnrollmentService {
  enrollmentRepo: any;

  constructor() {
    this.enrollmentRepo = AppDataSource.getRepository(EnrollmentModel);
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
          courseId: savedEnrollment.course.id,
          userId: savedEnrollment.studentId,
          enrollmentId: savedEnrollment.id,
          courseTitle: savedEnrollment.course.title,
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
          id: `course-enrollments-${courseId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, courseId }, "getCourseEnrollments failed");
      throw new Error("Error fetching course enrollments");
    }
  }

  async getOneOnOneEnrollementByTeacherId(
    teacherId: string
  ): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: {
          teacherId: teacherId,
          type: "one-on-one",
        },
        relations: ["sessions"],
        cache: {
          id: `teacher-one-on-one-enrollments-${teacherId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, teacherId }, "getOneOnOneEnrollementByTeacherId failed");
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
          id: `enrollment-${enrollmentId}`,
          milliseconds: 300000, // 5 minutes
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
          id: `student-course-enrollments-${studentId}`,
          milliseconds: 300000, // 5 minutes
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
        relations: ["sessions"],
        order: { createdAt: "DESC" },
        cache: {
          id: `student-one-on-one-enrollments-${studentId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, studentId }, "getStudentOneOnOneEnrollments failed");
      throw new Error("Error fetching student one-on-one enrollments");
    }
  }
}
