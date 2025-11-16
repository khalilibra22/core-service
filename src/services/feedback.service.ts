import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import { ComplaintModel } from "../models/complaint.model";
import { ReviewModel } from "../models/review.model";
import { PaginatedResult } from "../utils";

export class FeedbackService {
  reviewRepo: any;
  complaintRepo: any;
  constructor() {
    this.reviewRepo = AppDataSource.getRepository(ReviewModel);
    this.complaintRepo = AppDataSource.getRepository(ComplaintModel);
  }

  async createReview(review: ReviewModel): Promise<ReviewModel> {
    try {
      return await this.reviewRepo.save(review);
    } catch (error) {
      logger.error({ err: error }, "createReview failed");
      throw new Error("Error creating review");
    }
  }

  async updateReview(review: ReviewModel): Promise<ReviewModel> {
    try {
      return await this.reviewRepo.save(review);
    } catch (error) {
      logger.error({ err: error }, "updateReview failed");
      throw new Error("Error updating review");
    }
  }

  async softDeleteReview(id: string): Promise<void> {
    try {
      await this.reviewRepo.softDelete(id);
    } catch (error) {
      logger.error({ err: error, id }, "softDeleteReview failed");
      throw new Error("Error deleting review");
    }
  }

  async hasStudentReviewedCourse(studentId: string, courseId: string): Promise<boolean> {
    try {
      const count = await this.reviewRepo.count({
        where: {
          studentId: studentId,
          course: {
            id: courseId,
          },
        },
      });
      return count > 0;
    } catch (error) {
      logger.error({ err: error, studentId, courseId }, "hasStudentReviewedCourse failed");
      throw new Error("Error checking student review status");
    }
  }

  async createComplaint(complaint: ComplaintModel): Promise<ComplaintModel> {
    try {
      return await this.complaintRepo.save(complaint);
    } catch (error) {
      logger.error({ err: error }, "createComplaint failed");
      throw new Error("Error creating complaint");
    }
  }

  async getAllReviews(): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        cache: {
          id: "all-reviews",
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error }, "getAllReviews failed");
      throw new Error("Error fetching reviews");
    }
  }

  async getAllComplaints(): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        cache: {
          id: "all-complaints",
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error }, "getAllComplaints failed");
      throw new Error("Error fetching complaints");
    }
  }

  async getReviewById(id: string): Promise<ReviewModel | null> {
    try {
      return await this.reviewRepo.findOne({
        where: {
          id: id,
        },
        relations: ["course"],
        cache: {
          id: `review-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getReviewById failed");
      throw new Error("Error fetching review by ID");
    }
  }

  async getComplaintById(id: string): Promise<ComplaintModel | null> {
    try {
      return await this.complaintRepo.findOne({
        where: {
          id: id,
        },
        cache: {
          id: `complaint-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getComplaintById failed");
      throw new Error("Error fetching complaint by ID");
    }
  }

  async updateComplaint(
    complaint: ComplaintModel
  ): Promise<ComplaintModel | null> {
    try {
      return await this.complaintRepo.save(complaint);
    } catch (error) {
      logger.error({ err: error }, "updateComplaint failed");
      throw new Error("Error updating complaint");
    }
  }

  async getReviewsByCourseId(courseId: string): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        where: {
          course: {
            id: courseId,
          },
        },
        cache: {
          id: `course-reviews-${courseId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, courseId }, "getReviewsByCourseId failed");
      throw new Error("Error fetching reviews by course ID");
    }
  }

  async getComplaintsByStudentId(studentId: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        where: {
          studentId: studentId,
        },
        cache: {
          id: `student-complaints-${studentId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, studentId }, "getComplaintsByStudentId failed");
      throw new Error("Error fetching complaints by student ID");
    }
  }

  async getComplaintsByStatus(status: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        where: {
          status: status,
        },
        cache: {
          id: `complaints-status-${status}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, status }, "getComplaintsByStatus failed");
      throw new Error("Error fetching complaints by status");
    }
  }

  //delete complaint (soft delete)
  async deleteComplaint(id: string): Promise<void> {
    try {
      await this.complaintRepo.softDelete(id);
    } catch (error) {
      logger.error({ err: error, id }, "deleteComplaint failed");
      throw new Error("Error deleting complaint");
    }
  }

  //get reviews of prerecorded courses using pagination
  async getReviewsOfPrerecordedCourses(
    page: number,
    limit: number
  ): Promise<PaginatedResult<ReviewModel>> {
    try {
      const [data, total] = await this.reviewRepo.findAndCount({
        where: {
          course: {
            type: "prerecorded",
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        cache: {
          id: `prerecorded-reviews-${page}-${limit}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return { data, total };
    } catch (error) {
      logger.error({ err: error, page, limit }, "getReviewsOfPrerecordedCourses failed");
      throw new Error("Error fetching reviews of prerecorded courses");
    }
  }

  //get reviews by teacher id
  async getReviewsByTeacherId(teacherId: string): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        where: {
          course: {
            ownerId: teacherId,
          },
        },
        cache: {
          id: `teacher-reviews-${teacherId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, teacherId }, "getReviewsByTeacherId failed");
      throw new Error("Error fetching reviews by teacher ID");
    }
  }

  // get reviews by one-on-one teacher id
  async getReviewsByOneOnOneTeacherId(
    teacherId: string
  ): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        where: {
          teacherId: teacherId,
        },
        cache: {
          id: `one-on-one-teacher-reviews-${teacherId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, teacherId }, "getReviewsByOneOnOneTeacherId failed");
      throw new Error("Error fetching reviews by one-on-one teacher ID");
    }
  }

  // get all reviews by teacher id
  async getAllReviewsByTeacherId(teacherId: string): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        where: [
          { course: { ownerId: teacherId } }, // courses
          { teacherId }, // one-on-one
        ],
        cache: {
          id: `all-teacher-reviews-${teacherId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, teacherId }, "getAllReviewsByTeacherId failed");
      // Preserve error context
      throw new Error(
        `Error fetching reviews for teacher ${teacherId}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async getComplaintsByTeacherId(teacherId: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo
        .createQueryBuilder("complaint")
        .leftJoinAndSelect("complaint.session", "session")
        .leftJoinAndSelect("session.course", "course")
        .leftJoinAndSelect("session.enrollment", "enrollment")
        .where("course.ownerId = :teacherId", { teacherId })
        .orWhere("enrollment.teacherId = :teacherId", { teacherId })
        .cache(`teacher-complaints-${teacherId}`, 300000) // 5 minutes in milliseconds
        .getMany();
    } catch (error) {
      logger.error({ err: error, teacherId }, "getComplaintsByTeacherId failed");
      throw new Error("Error fetching complaints by teacher ID");
    }
  }

  async getTeacherIdByComplaintId(complaintId: string): Promise<string | null> {
    try {
      const complaint = await this.complaintRepo.findOne({
        where: { id: complaintId },
        relations: ["session", "session.course"],
        cache: {
          id: `complaint-teacher-${complaintId}`,
          milliseconds: 300000, // 5 minutes
        },
      });
      return complaint?.session?.course?.ownerId ?? null;
    } catch (error) {
      logger.error({ err: error, complaintId }, "getTeacherIdByComplaintId failed");
      throw new Error("Error fetching teacher ID by complaint ID");
    }
  }

  async getRefundComplaintById(id: string): Promise<ComplaintModel | null> {
    try {
      return await this.complaintRepo.findOne({
        where: {
          id: id,
          type: "refund",
        },
        relations: ["enrollment", "enrollment.course"],
        cache: {
          id: `refund-complaint-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getRefundComplaintById failed");
      throw new Error("Error fetching complaint by ID");
    }
  }
}
