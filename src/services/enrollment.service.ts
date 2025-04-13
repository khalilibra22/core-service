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

  async getCourseEnrollments(
    courseId: string
  ): Promise<CourseEnrollmentModel[]> {
    try {
      return await this.courseEnrollmentRepo.find({
        where: { course: { id: courseId } },
      });
    } catch (error) {
      throw new Error("Error fetching course enrollments");
    }
  }

  async getOneOnOneEnrollementByTeacherId(
    teacherId: string
  ): Promise<SessionEnrollmentModel[]> {
    try {
      return await this.sessionEnrollmentRepo.find({
        where: {
          session: {
            course: {
              teacherId: teacherId,
            },
          },
        },
      });
    } catch (error) {
      throw new Error("Error fetching session enrollments");
    }
  }

  async updateCourseEnrollment(
    enrollment: CourseEnrollmentModel
  ): Promise<CourseEnrollmentModel> {
    try {
      return await this.courseEnrollmentRepo.save(enrollment);
    } catch (error) {
      throw new Error("Error creating course enrollment");
    }
  }

  async getCourseEnrollmentById(
    enrollmentId: string
  ): Promise<CourseEnrollmentModel | null> {
    try {
      return await this.courseEnrollmentRepo.findOneBy({
        id: enrollmentId,
      });
    } catch (error) {
      throw new Error("Error fetching course enrollment by ID");
    }
  }
}
