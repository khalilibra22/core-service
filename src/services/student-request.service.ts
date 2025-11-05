import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import { StudentRequestModel } from "../models/student-request.model";

export class StudentRequestService {
  studentRequestRepo: any;

  constructor() {
    this.studentRequestRepo = AppDataSource.getRepository(StudentRequestModel);
  }

  async createStudentRequest(
    request: StudentRequestModel
  ): Promise<StudentRequestModel> {
    try {
      return await this.studentRequestRepo.save(request);
    } catch (error) {
      logger.error({ err: error }, "createStudentRequest failed");
      throw new Error("Error creating student request");
    }
  }

  async getStudentRequestById(
    id: string
  ): Promise<StudentRequestModel | null> {
    try {
      return await this.studentRequestRepo.findOne({
        where: { id },
        relations: ["course"],
        cache: {
          id: `student-request-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getStudentRequestById failed");
      throw new Error("Error fetching student request by ID");
    }
  }

  async getStudentRequestsByCourseId(
    courseId: string
  ): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestRepo.find({
        where: {
          course: { id: courseId },
        },
        relations: ["course"],
        order: { createdAt: "DESC" },
        cache: {
          id: `course-student-requests-${courseId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, courseId }, "getStudentRequestsByCourseId failed");
      throw new Error("Error fetching student requests by course ID");
    }
  }

  async getStudentRequestsByStudentId(
    studentId: string
  ): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestRepo.find({
        where: { studentId },
        relations: ["course"],
        order: { createdAt: "DESC" },
        cache: {
          id: `student-requests-${studentId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, studentId }, "getStudentRequestsByStudentId failed");
      throw new Error("Error fetching student requests by student ID");
    }
  }

  async getStudentRequestsByOwnerId(
    ownerId: string
  ): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestRepo.find({
        where: {
          course: { ownerId },
        },
        relations: ["course"],
        order: { createdAt: "DESC" },
        cache: {
          id: `owner-student-requests-${ownerId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, ownerId }, "getStudentRequestsByOwnerId failed");
      throw new Error("Error fetching student requests by owner ID");
    }
  }

  async getStudentRequestsByStatus(
    status: string
  ): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestRepo.find({
        where: { status },
        relations: ["course"],
        order: { createdAt: "DESC" },
        cache: {
          id: `student-requests-status-${status}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, status }, "getStudentRequestsByStatus failed");
      throw new Error("Error fetching student requests by status");
    }
  }

  async getStudentRequestsByType(
    type: string
  ): Promise<StudentRequestModel[]> {
    try {
      return await this.studentRequestRepo.find({
        where: { type },
        relations: ["course"],
        order: { createdAt: "DESC" },
        cache: {
          id: `student-requests-type-${type}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, type }, "getStudentRequestsByType failed");
      throw new Error("Error fetching student requests by type");
    }
  }

  async updateStudentRequest(
    request: StudentRequestModel
  ): Promise<StudentRequestModel> {
    try {
      return await this.studentRequestRepo.save(request);
    } catch (error) {
      logger.error({ err: error }, "updateStudentRequest failed");
      throw new Error("Error updating student request");
    }
  }

  async deleteStudentRequest(id: string): Promise<void> {
    try {
      await this.studentRequestRepo.softDelete(id);
    } catch (error) {
      logger.error({ err: error, id }, "deleteStudentRequest failed");
      throw new Error("Error deleting student request");
    }
  }

  async hasStudentRequestedCertificate(
    studentId: string,
    courseId: string
  ): Promise<boolean> {
    try {
      const count = await this.studentRequestRepo.count({
        where: {
          studentId,
          course: { id: courseId },
          type: "certificate",
          status: "pending",
        },
      });
      return count > 0;
    } catch (error) {
      logger.error({ err: error, studentId, courseId }, "hasStudentRequestedCertificate failed");
      throw new Error("Error checking certificate request status");
    }
  }
}

