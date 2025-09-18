import { In } from "typeorm";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";

export class EnrollmentService {
  enrollmentRepo: any;

  constructor() {
    this.enrollmentRepo = AppDataSource.getRepository(EnrollmentModel);
  }

  async createEnrollment(
    enrollment: EnrollmentModel
  ): Promise<EnrollmentModel> {
    try {
      return await this.enrollmentRepo.save(enrollment);
    } catch (error) {
      console.log(error);
      throw new Error("Error creating course enrollment");
    }
  }

  async getCourseEnrollments(courseId: string): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: { course: { id: courseId }, type: "course" },
        relations: ["course"],
      });
    } catch (error) {
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
      });
    } catch (error) {
      throw new Error("Error fetching session enrollments");
    }
  }

  async updateEnrollment(
    enrollment: EnrollmentModel
  ): Promise<EnrollmentModel> {
    try {
      return await this.enrollmentRepo.save(enrollment);
    } catch (error) {
      throw new Error("Error creating course enrollment");
    }
  }

  async getEnrollmentById(
    enrollmentId: string
  ): Promise<EnrollmentModel | null> {
    try {
      return await this.enrollmentRepo.findOneBy({
        id: enrollmentId,
      });
    } catch (error) {
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
  ): Promise<EnrollmentModel[]> {
    try {
      return await this.enrollmentRepo.find({
        where: { studentId: studentId, type: "one-on-one" },
        relations: ["sessions"],
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      throw new Error("Error fetching student one-on-one enrollments");
    }
  }
}
