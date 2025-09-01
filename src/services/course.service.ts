import { AppDataSource } from "../config/database";
import { CertificateModel } from "../models/certificate.model";
import { CourseModel } from "../models/course.model";
import { CourseSettingsModel } from "../models/courseSettings.model";
import { LessonModel } from "../models/lesson.model";
import { SessionModel } from "../models/session.model";

export class CourseService {
  courseRepo: any;
  courseSettingsRepo: any;
  sessionRepo: any;
  certificateRepo: any;
  lessonRepo: any;
  constructor() {
    this.courseRepo = AppDataSource.getRepository(CourseModel);
    this.courseSettingsRepo = AppDataSource.getRepository(CourseSettingsModel);
    this.sessionRepo = AppDataSource.getRepository(SessionModel);
    this.certificateRepo = AppDataSource.getRepository(CertificateModel);
    this.lessonRepo = AppDataSource.getRepository(LessonModel);
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
      console.log(error);
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
          ownerId: teacherId,
          type: type,
        },
        relations: ["couresSettings", "enrollments", "sessions"],
      });
    } catch (error) {
      throw new Error("Error fetching courses by teacher ID");
    }
  }

  //get all courses of type live using pagination
  async getAllLiveCourses(page: number, limit: number): Promise<CourseModel[]> {
    try {
      return await this.courseRepo.find({
        where: {
          type: "live",
        },
        relations: ["couresSettings", "enrollments"],
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching all courses of type live");
    }
  }

  async getAllGroupCourses(
    page: number,
    limit: number
  ): Promise<CourseModel[]> {
    try {
      return await this.courseRepo.find({
        where: {
          type: "group",
        },
        relations: ["couresSettings", "enrollments"],
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching all courses of type group");
    }
  }

  //get all courses of type prerecorded using pagination
  async getAllPrerecordedCourses(
    page: number,
    limit: number
  ): Promise<CourseModel[]> {
    try {
      return await this.courseRepo.find({
        where: {
          type: "prerecorded",
        },
        relations: ["couresSettings", "enrollments", "sessions"],
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching all courses of type prerecorded");
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      await this.sessionRepo.softDelete(id);
    } catch (error: any) {
      throw new Error("Error deleting session");
    }
  }

  async deleteCourse(id: string): Promise<void> {
    try {
      await this.courseRepo.softDelete(id);
    } catch (error: any) {
      throw new Error("Error deleting course");
    }
  }

  // create lesson
  async createLesson(lesson: LessonModel): Promise<LessonModel> {
    try {
      return await this.lessonRepo.save(lesson);
    } catch (error: any) {
      throw new Error("Error creating lesson: " + error.message);
    }
  }

  // get lesson by id
  async getLessonById(id: string): Promise<LessonModel | null> {
    try {
      return await this.lessonRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error: any) {
      throw new Error("Error fetching lesson by ID: " + error.message);
    }
  }

  // get lessons by session id
  async getLessonsBySessionId(sessionId: string): Promise<LessonModel[]> {
    try {
      return await this.lessonRepo.find({
        where: {
          session: {
            id: sessionId,
          },
        },
      });
    } catch (error: any) {
      throw new Error("Error fetching lessons by session ID: " + error.message);
    }
  }

  // update lesson
  async updateLesson(lesson: LessonModel): Promise<LessonModel> {
    try {
      return await this.lessonRepo.save(lesson);
    } catch (error: any) {
      throw new Error("Error updating lesson: " + error.message);
    }
  }

  // delete lesson
  async deleteLesson(id: string): Promise<void> {
    try {
      await this.lessonRepo.softDelete(id);
    } catch (error: any) {
      throw new Error("Error deleting lesson: " + error.message);
    }
  }

  // get prerecorded session details by id with lessons and quizzes
  async getPrerecordedSessionDetails(id: string): Promise<SessionModel | null> {
    try {
      return await this.sessionRepo.findOne({
        where: {
          id: id,
        },
        relations: ["lessons", "quizzes", "course"],
      });
    } catch (error: any) {
      throw new Error(
        "Error fetching prerecorded session details: " + error.message
      );
    }
  }

  // get prerecorded course by id with sessions and sessions lessons and quizzes
  async getPrerecordedCourseSections(id: string): Promise<CourseModel | null> {
    try {
      return await this.sessionRepo.find({
        where: {
          course: {
            id: id,
          },
        },
        relations: ["lessons", "quizzes"],
      });
    } catch (error: any) {
      throw new Error(
        "Error fetching prerecorded course sections: " + error.message
      );
    }
  }

  async searchCourses(
    type: string,
    page: number,
    limit: number
  ): Promise<CourseModel[]> {
    try {
      return await this.courseRepo.find({
        where: {
          type: type,
        },
        relations: ["couresSettings", "enrollments"],
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching all courses of type live");
    }
  }

  async getTeacherOneOnOneSessions(teacherId: string): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          enrollment: {
            teacherId: teacherId,
          },
        },
      });
    } catch (error) {
      throw new Error("Error fetching one on one sessions by teacher ID");
    }
  }

  async getOneOnOneSessionsByEnrollmentId(
    enrollmentId: string
  ): Promise<SessionModel[]> {
    try {
      return await this.sessionRepo.find({
        where: {
          enrollment: {
            id: enrollmentId,
          },
        },
      });
    } catch (error) {
      throw new Error("Error fetching one on one sessions by teacher ID");
    }
  }
}
