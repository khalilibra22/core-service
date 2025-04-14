import { AppDataSource } from "../config/database";
import { CertificateModel } from "../models/certificate.model";
import { CourseModel } from "../models/course.model";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { SessionModel } from "../models/session.model";

export class CoursService {
  courseRepo: any;
  courseSettingsRepo: any;
  sessionRepo: any;
  certificateRepo: any;
  constructor() {
    this.courseRepo = AppDataSource.getRepository(CourseModel);
    this.courseSettingsRepo = AppDataSource.getRepository(CourseSettingsModel);
    this.sessionRepo = AppDataSource.getRepository(SessionModel);
    this.certificateRepo = AppDataSource.getRepository(CertificateModel);
  }

  async createCourse(course: CourseModel): Promise<CourseModel> {
    try {
      return await this.courseRepo.save(course);
    } catch (error) {
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
        relations: ["couresSettings"],
      });
    } catch (error: any) {
      throw new Error("Error fetching course by ID : " + error.message);
    }
  }

  async createCourseSession(session: SessionModel): Promise<SessionModel> {
    try {
      return await this.sessionRepo.save(session);
    } catch (error: any) {
      throw new Error("Error creating course session: " + error.message);
    }
  }

  async getSessionById(id: string): Promise<SessionModel | null> {
    try {
      return await this.sessionRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching session by ID");
    }
  }

  async updateSession(session: SessionModel): Promise<SessionModel> {
    try {
      return await this.sessionRepo.save(session);
    } catch (error: any) {
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
      });
    } catch (error) {
      throw new Error("Error fetching course sessions");
    }
  }

  // update course
  async updateCourse(course: CourseModel): Promise<CourseModel> {
    try {
      return await this.courseRepo.save(course);
    } catch (error) {
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
      });
    } catch (error) {
      throw new Error("Error fetching course by ID with enrollments");
    }
  }

  //getCoursesByTeacherId
  async getCoursesByTeacherId(
    teacherId: string,
    type: string
  ): Promise<CourseModel[]> {
    try {
      return await this.courseRepo.find({
        where: {
          teacherId: teacherId,
          type: type,
        },
        relations: ["couresSettings"],
      });
    } catch (error) {
      throw new Error("Error fetching courses by teacher ID");
    }
  }
}
