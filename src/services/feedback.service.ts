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
      // Set deadline for 72 hours from now for tutor response
      if (!complaint.autoEscalateAt) {
        complaint.autoEscalateAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      }

      // Initialize timeline
      complaint.timeline = [
        {
          action: "CREATED",
          actor: "LEARNER",
          message: complaint.description || "Issue reported",
          at: new Date().toISOString(),
        },
      ];

      // Keep legacy deadline for backward compatibility if needed, or unify
      if (!complaint.deadline) {
        complaint.deadline = complaint.autoEscalateAt;
      }

      return await this.complaintRepo.save(complaint);
    } catch (error) {
      logger.error({ err: error }, "createComplaint failed");
      throw new Error("Error creating complaint");
    }
  }

  async addTimelineEvent(
    complaintId: string,
    event: { action: string; actor: string; message: string }
  ): Promise<ComplaintModel | null> {
    const complaint = await this.getComplaintById(complaintId);
    if (!complaint) return null;

    if (!complaint.timeline) complaint.timeline = [];
    complaint.timeline.push({
      ...event,
      at: new Date().toISOString(),
    });

    return await this.complaintRepo.save(complaint);
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
        where: { id },
        relations: ["session", "session.course", "enrollment", "enrollment.course"],
        cache: {
          id: `complaint-detailed-${id}`,
          milliseconds: 60000, // 1 min for detailed view
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

  async getComplaints(
    role: "learner" | "tutor",
    userId: string,
    filters: { status?: string; page?: number; limit?: number }
  ): Promise<PaginatedResult<ComplaintModel>> {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const query = this.complaintRepo
        .createQueryBuilder("complaint")
        .leftJoinAndSelect("complaint.session", "session")
        .leftJoinAndSelect("session.course", "course")
        .leftJoinAndSelect("complaint.enrollment", "enrollment")
        .leftJoinAndSelect("enrollment.course", "eCourse");

      if (role === "learner") {
        query.where("complaint.studentId = :userId", { userId });
      } else {
        // Tutor can be owner of session.course or enrollment.teacherId
        query.where("course.ownerId = :userId OR enrollment.teacherId = :userId OR eCourse.ownerId = :userId", { userId });
      }

      if (status) {
        query.andWhere("complaint.status = :status", { status });
      }

      const [data, total] = await query
        .orderBy("complaint.createdAt", "DESC")
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total };
    } catch (error) {
      logger.error({ err: error, role, userId, filters }, "getComplaints failed");
      throw new Error("Error fetching complaints list");
    }
  }

  async getComplaintsByStudentId(studentId: string): Promise<ComplaintModel[]> {
    try {
      return await this.complaintRepo.find({
        where: {
          studentId: studentId,
        },
        relations: ["session", "session.course", "enrollment", "enrollment.course"],
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
        `Error fetching reviews for teacher ${teacherId}: ${error instanceof Error ? error.message : error
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

  async getTutorIssueStats(tutorId: string) {
    try {
      const stats = await this.complaintRepo
        .createQueryBuilder("complaint")
        .leftJoin("complaint.session", "session")
        .leftJoin("session.course", "course")
        .leftJoin("complaint.enrollment", "enrollment")
        .select("complaint.status", "status")
        .addSelect("COUNT(*)", "count")
        .where("course.ownerId = :tutorId OR enrollment.teacherId = :tutorId", { tutorId })
        .groupBy("complaint.status")
        .getRawMany();

      const result = {
        total: 0,
        inProgress: 0,
        escalated: 0,
        resolved: 0,
        closed: 0,
      };

      stats.forEach((s: { status: string; count: string }) => {
        const count = parseInt(s.count);
        result.total += count;
        if (s.status === "pending") result.inProgress += count;
        else if (s.status === "escalated") result.escalated += count;
        else if (s.status === "resolved") result.resolved += count;
        else if (s.status === "closed") result.closed += count;
      });

      return result;
    } catch (error) {
      logger.error({ err: error, tutorId }, "getTutorIssueStats failed");
      throw new Error("Error calculating tutor issue statistics");
    }
  }

  async getAdminDisputeStats() {
    try {
      // Calculate actionRequired (escalated), autoEscalated, resolvedCases, totalRefunded
      // This is dynamic, so we perform counts.
      const stats = await this.complaintRepo
        .createQueryBuilder("complaint")
        .select("complaint.status", "status")
        .addSelect("COUNT(*)", "count")
        .addSelect("SUM(CASE WHEN complaint.refund_status = 'completed' THEN complaint.amount ELSE 0 END)", "totalRefunded")
        .groupBy("complaint.status")
        .getRawMany();

      const result = {
        actionRequired: 0,
        autoEscalated: 0,
        resolvedCases: 0,
        resolutionRate: 0,
        avgResolutionTimeHours: 24, // Placeholder or calculate from timeline
        totalRefunded: 0,
      };

      let totalCases = 0;
      stats.forEach((s: { status: string; count: string; totalRefunded: string }) => {
        const count = parseInt(s.count);
        totalCases += count;
        result.totalRefunded += parseFloat(s.totalRefunded || "0");

        if (s.status === "escalated") result.actionRequired += count;
        if (s.status === "resolved") result.resolvedCases += count;
      });

      if (totalCases > 0) {
        result.resolutionRate = Math.round((result.resolvedCases / totalCases) * 100);
      }

      // autoEscalated: check timeline for actor === 'SYSTEM' and action === 'ESCALATED'
      const autoEscalatedCount = await this.complaintRepo
        .createQueryBuilder("complaint")
        .where("complaint.timeline::text LIKE :pattern", { pattern: '%"actor":"SYSTEM","action":"ESCALATED"%' })
        .getCount();
      result.autoEscalated = autoEscalatedCount;

      return result;
    } catch (error) {
      logger.error({ err: error }, "getAdminDisputeStats failed");
      throw new Error("Error calculating admin dispute statistics");
    }
  }

  async getAdminDisputes(filters: { status?: string; service?: string; reporter?: string; page?: number; limit?: number }) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const query = this.complaintRepo
        .createQueryBuilder("complaint")
        .leftJoinAndSelect("complaint.session", "session")
        .leftJoinAndSelect("session.course", "course")
        .leftJoinAndSelect("complaint.enrollment", "enrollment")
        .leftJoinAndSelect("enrollment.course", "eCourse");

      if (status) query.andWhere("complaint.status = :status", { status });
      // Filter by service name or reporter name would require joining with user names or searching course titles
      // For now, simple status filtering.

      const [data, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return { data, total };
    } catch (error) {
      logger.error({ err: error, filters }, "getAdminDisputes failed");
      throw new Error("Error fetching admin disputes");
    }
  }
}
