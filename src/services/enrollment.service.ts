import { AppDataSource } from "../config/database";
import { CourseModel } from "../models/course.model";
import { CourseEnrollmentModel } from "../models/courseEnrollment.model";
import { SessionEnrollmentModel } from "../models/sessionEnrollment.model";

export class EnrollmentService {
  courseEnrollmentRepo: any;
  sessionEnrollmentRepo: any;
  courseRepo: any;

  constructor() {
    this.courseEnrollmentRepo = AppDataSource.getRepository(
      CourseEnrollmentModel
    );
    this.sessionEnrollmentRepo = AppDataSource.getRepository(
      SessionEnrollmentModel
    );
    this.courseRepo = AppDataSource.getRepository(CourseModel);
  }

  async createCourseEnrollment(
    enrollment: CourseEnrollmentModel
  ): Promise<CourseEnrollmentModel> {
    try {
      return await this.courseEnrollmentRepo.save(enrollment);
    } catch (error) {
      throw new Error("Error creating course enrollment");
    }
  }

  async createSessionEnrollment(
    enrollment: SessionEnrollmentModel
  ): Promise<SessionEnrollmentModel> {
    try {
      return await this.sessionEnrollmentRepo.save(enrollment);
    } catch (error) {
      throw new Error("Error creating session enrollment");
    }
  }
}
