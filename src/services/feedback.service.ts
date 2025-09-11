import { AppDataSource } from "../config/database";
import { ComplaintModel } from "../models/complaint.model";
import { ReviewModel } from "../models/review.model";

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
      console.error(error);
      throw new Error("Error creating review");
    }
  }

  async createComplaint(complaint: ComplaintModel): Promise<ComplaintModel> {
    try {
      return await this.complaintRepo.save(complaint);
    } catch (error) {
      console.error(error);
      throw new Error("Error creating complaint");
    }
  }

  async getAllReviews(): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find();
    } catch (error) {
      throw new Error("Error fetching reviews");
    }
  }

  async getAllComplaints(): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find();
    } catch (error) {
      throw new Error("Error fetching complaints");
    }
  }

  async getReviewById(id: string): Promise<ReviewModel | null> {
    try {
      return await this.reviewRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching review by ID");
    }
  }

  async getComplaintById(id: string): Promise<ComplaintModel | null> {
    try {
      return await this.complaintRepo.findOne({
        where: {
          id: id,
        },
      });
    } catch (error) {
      throw new Error("Error fetching complaint by ID");
    }
  }

  async updateComplaint(
    complaint: ComplaintModel
  ): Promise<ComplaintModel | null> {
    try {
      return await this.complaintRepo.save(complaint);
    } catch (error) {
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
      });
    } catch (error) {
      throw new Error("Error fetching reviews by course ID");
    }
  }

  async getComplaintsByStudentId(studentId: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        where: {
          studentId: studentId,
        },
      });
    } catch (error) {
      throw new Error("Error fetching complaints by student ID");
    }
  }

  async getComplaintsByStatus(status: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        where: {
          status: status,
        },
      });
    } catch (error) {
      throw new Error("Error fetching complaints by status");
    }
  }

  //delete complaint (soft delete)
  async deleteComplaint(id: string): Promise<void> {
    try {
      await this.complaintRepo.softDelete(id);
    } catch (error) {
      throw new Error("Error deleting complaint");
    }
  }

  //get reviews of prerecorded courses using pagination
  async getReviewsOfPrerecordedCourses(
    page: number,
    limit: number
  ): Promise<ReviewModel[]> {
    try {
      return await this.reviewRepo.find({
        where: {
          course: {
            type: "prerecorded",
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
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
      });
    } catch (error) {
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
      });
    } catch (error) {
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
      });
    } catch (error) {
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
        .getMany();
    } catch (error) {
      console.log(error);
      throw new Error("Error fetching complaints by teacher ID");
    }
  }

  async getTeacherIdByComplaintId(complaintId: string): Promise<string | null> {
    try {
      const complaint = await this.complaintRepo.findOne({
        where: { id: complaintId },
        relations: ["session", "session.course"],
      });
      return complaint?.session?.course?.ownerId ?? null;
    } catch (error) {
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
      });
    } catch (error) {
      throw new Error("Error fetching complaint by ID");
    }
  }
}
