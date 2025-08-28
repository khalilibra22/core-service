import { In } from "typeorm";
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
      console.log("Error in createSessionEnrollment:", error);
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
              ownerId: teacherId,
            },
          },
        },
        relations: ["session", "session.course"],
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

  //get student ernollments by student id
  async getStudentCoursesEnrollments(
    studentId: string
  ): Promise<CourseEnrollmentModel[]> {
    try {
      return await this.courseEnrollmentRepo.find({
        where: {
          studentId: studentId,
          course: { type: In(["live", "group"]) },
        },
        relations: ["course", "course.couresSettings", "course.sessions"], //group by createdAt , newest first
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw new Error("Error fetching student enrollments");
    }
  }

  async getStudentOneOnOneEnrollments(
    studentId: string
  ): Promise<SessionEnrollmentModel[]> {
    try {
      return await this.sessionEnrollmentRepo.find({
        where: { studentId: studentId },
        relations: ["sessions"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw new Error("Error fetching student one-on-one enrollments");
    }
  }

  // get one on one enrollments by id
  async getOneOnOneEnrollmentById(
    enrollmentId: string
  ): Promise<SessionEnrollmentModel | null> {
    try {
      return await this.sessionEnrollmentRepo.findOne({
        where: { id: enrollmentId },
      });
    } catch (error) {
      throw new Error("Error fetching one-on-one enrollment by ID");
    }
  }

  // update one on one enrollment
  async updateOneOnOneEnrollment(
    enrollment: SessionEnrollmentModel
  ): Promise<SessionEnrollmentModel> {
    try {
      return await this.sessionEnrollmentRepo.save(enrollment);
    } catch (error) {
      throw new Error("Error updating one-on-one enrollment");
    }
  }
}
