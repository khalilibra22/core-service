import { In, Repository } from "typeorm";
import { injectable, inject } from "tsyringe";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { publish } from "../events";
import { CACHE_KEYS, CACHE_TTL } from "../config/constants";

@injectable()
export class EnrollmentService {
  constructor(
    @inject("EnrollmentRepository") private enrollmentRepo: Repository<EnrollmentModel>
  ) { }

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
        cache: false,
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
        cache: false,
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
      logger.info({ enrollmentId: enrollment.id }, "Saving enrollment to database...");
      const saved = await this.enrollmentRepo.save(enrollment);
      logger.info({ enrollmentId: saved.id }, "Enrollment saved successfully");
      return saved;
    } catch (error) {
      logger.error({ err: error, enrollmentId: enrollment.id }, "updateEnrollment failed");
      throw new Error("Error updating enrollment");
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
        relations: ["course", "course.couresSettings", "course.sessions"],
        order: { createdAt: "DESC" },
        cache: false,
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
        cache: false,
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

  async updateEnrollmentPaymentStatus(
    enrollmentId: string,
    status: string,
    paymentId?: string,
    paymentProvider?: string
  ): Promise<EnrollmentModel> {
    try {
      const enrollment = await this.enrollmentRepo.findOne({ where: { id: enrollmentId } });
      if (!enrollment) throw new Error("Enrollment not found");

      enrollment.paymentStatus = status;
      if (paymentId) enrollment.paymentId = paymentId;
      if (paymentProvider) enrollment.paymentProvider = paymentProvider;

      if (status === "paid") {
        enrollment.status = "approved"; // Auto-approve if paid?
      }

      return await this.enrollmentRepo.save(enrollment);
    } catch (error) {
      logger.error({ err: error, enrollmentId }, "updateEnrollmentPaymentStatus failed");
      throw new Error("Error updating enrollment payment status");
    }
  }
}
