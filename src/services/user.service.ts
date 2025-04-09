import { AppDataSource } from "../config/database";
import { DataSource } from "typeorm";
import { CourseModel } from "../models/course.model";

export class UserService {
  userRepo: any;
  constructor() {
    this.userRepo = AppDataSource.getRepository(CourseModel);
  }

  async createCourse(user: CourseModel): Promise<CourseModel> {
    try {
      return await this.userRepo.save(user);
    } catch (error) {
      throw new Error("Error creating user");
    }
  }
}
