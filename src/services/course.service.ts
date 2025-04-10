import { AppDataSource } from "../config/database";
import { CourseModel } from "../models/course.model";
import { SessionModel } from "../models/session.model";

export class CoursService {
  courseRepo: any;
  sessionRepo: any;
  constructor() {
    this.courseRepo = AppDataSource.getRepository(CourseModel);
    this.sessionRepo = AppDataSource.getRepository(SessionModel);
  }

  async createCourse(course: CourseModel): Promise<CourseModel> {
    try {
      return await this.courseRepo.save(course);
    } catch (error) {
      throw new Error("Error creating course");
    }
  }

  // get course by id
  async getCourseById(id: string): Promise<CourseModel | null> {
    try {
      return await this.courseRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching course by ID");
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
}
