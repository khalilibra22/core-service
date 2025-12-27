import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { FeedbackService } from "../services/feedback.service";
import { EnrollmentService } from "../services/enrollment.service";
import { ReviewDto } from "../dtos/review.dto";
import { ComplaintDto } from "../dtos/complaint.dto";
import { ComplaintListDto } from "../dtos/complaint-list.dto";
import { enrichDto, setPaginationHeaders } from "../utils";

export class FeedbackController {
  private feedbackService: FeedbackService;
  private courseService: CourseService;
  private enrollmentService: EnrollmentService;
  constructor() {
    this.feedbackService = new FeedbackService();
    this.courseService = new CourseService();
    this.enrollmentService = new EnrollmentService();
  }

  createCourseReview = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if the user already reviewed the course (efficient query)
      const hasReviewed = await this.feedbackService.hasStudentReviewedCourse(
        req.body.ownerId,
        req.params.id
      );
      if (hasReviewed) {
        res.status(409).json({ error: "You have already reviewed this course" });
        return;
      }

      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      req.body.studentId = req.body.ownerId;
      delete req.body.ownerId;
      const reviewBody = {
        ...req.body,
        course: course,
      };
      const review = await this.feedbackService.createReview(reviewBody);
      const reviewDto = await enrichDto<ReviewDto>(ReviewDto, review);
      res.status(201).json(reviewDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "createCourseReview failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  updateCourseReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const reviewId = req.params.reviewId;

      const review = await this.feedbackService.getReviewById(reviewId);
      if (!review) {
        res.status(404).json({ error: "Review not found" });
        return;
      }

      // Verify the review belongs to the course
      if (review.course?.id !== courseId) {
        res.status(404).json({ error: "Review not found for this course" });
        return;
      }

      // Verify ownership
      if (review.studentId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this review" });
        return;
      }

      // Update only allowed fields
      review.rating = req.body.rating;
      review.title = req.body.title;
      review.comment = req.body.comment;

      const updatedReview = await this.feedbackService.updateReview(review);
      const reviewDto = await enrichDto<ReviewDto>(ReviewDto, updatedReview);
      res.status(200).json(reviewDto);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id, reviewId: req.params.reviewId }, "updateCourseReview failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  deleteCourseReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const reviewId = req.params.reviewId;

      const review = await this.feedbackService.getReviewById(reviewId);
      if (!review) {
        res.status(404).json({ error: "Review not found" });
        return;
      }

      // Verify the review belongs to the course
      if (review.course?.id !== courseId) {
        res.status(404).json({ error: "Review not found for this course" });
        return;
      }

      // Verify ownership
      if (review.studentId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this review" });
        return;
      }

      await this.feedbackService.softDeleteReview(reviewId);
      res.status(204).send();
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id, reviewId: req.params.reviewId }, "deleteCourseReview failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  createComplaint = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sessionId, enrollmentId, courseId, referenceId, issueType, description, attachments, ownerId } = req.body;

      // Enforce Business Logic:
      // 1. REFUND_REQUEST -> Course or Enrollment (1:1)
      // 2. Others -> Session

      const complaintBody: any = {
        studentId: ownerId,
        referenceId: referenceId,
        type: issueType || "general",
        reason: description, // Mapping description to reason for DB compliance
        description: description,
        attachments: attachments,
        status: "pending",
      };

      if (issueType === "REFUND_REQUEST") {
        if (!courseId && !enrollmentId) {
          res.status(400).json({ error: "Refund requests must be linked to a Course or an Enrollment" });
          return;
        }
        if (courseId) {
          const course = await this.courseService.getCourseById(courseId);
          if (course) complaintBody.course = course;
        }
        if (enrollmentId) {
          const enrollment = await this.enrollmentService.getEnrollmentById(enrollmentId);
          if (enrollment) complaintBody.enrollment = enrollment;
        }
      } else {
        const finalSessionId = sessionId || req.params.id;
        if (!finalSessionId) {
          res.status(400).json({ error: "Other complaint types must be linked to a Session" });
          return;
        }
        const session = await this.courseService.getSessionById(finalSessionId);
        if (!session) {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        complaintBody.session = session;
      }

      const complaint = await this.feedbackService.createComplaint(complaintBody);

      res.status(201).json({
        id: complaint.id,
        status: "IN_PROGRESS",
        autoEscalateAt: complaint.autoEscalateAt
      });
    } catch (error) {
      req.log.error({ err: error }, "createComplaint failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  addComplaintInitialResponse = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const complaint = await this.feedbackService.getComplaintById(
        req.params.id
      );
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      const teacherId = await this.feedbackService.getTeacherIdByComplaintId(
        req.params.id
      );
      if (!teacherId || teacherId !== req.body.ownerId) {
        res.status(403).json({ error: "You are not the owner of this course" });
        return;
      }
      if (complaint.status !== "pending") {
        res.status(409).json({ error: "Complaint already responded" });
        return;
      }
      complaint.initialResponse = req.body.initialResponse;
      complaint.status = "responded";
      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaint
      );
      const complaintDto = await enrichDto<ComplaintDto>(ComplaintDto, updatedComplaint);
      res.status(200).json(complaintDto);
    } catch (error) {
      req.log.error({ err: error, complaintId: req.params.id }, "addComplaintInitialResponse failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  complaintAdminResolve = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const complaintId = req.params.id;
      const complaint = await this.feedbackService.getComplaintById(
        complaintId
      );
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      if (complaint.status !== "escalated") {
        res
          .status(409)
          .json({ error: "Complaint is not escalated or already resolved" });
        return;
      }
      req.body.resolvedBy = req.body.ownerId; // Assuming the resolver is the owner
      delete req.body.ownerId;
      const complaintBody = {
        ...complaint,
        ...req.body,
        status: "resolved",
      };

      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaintBody
      );
      const complaintDto = await enrichDto<ComplaintDto>(ComplaintDto, updatedComplaint);
      res.status(200).json(complaintDto);
    } catch (error) {
      req.log.error({ err: error, complaintId: req.params.id }, "complaintAdminResolve failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  learnerDecision = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaintId = req.params.id;
      const complaint = await this.feedbackService.getComplaintById(complaintId);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      if (complaint.studentId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the student can submit a decision" });
        return;
      }

      if (complaint.status !== "pending_learner" && complaint.status !== "responded") {
        res.status(409).json({ error: "Complaint is not awaiting learner decision" });
        return;
      }

      const { studentDecision, reason } = req.body;
      complaint.studentDecision = studentDecision; // 'accepted' or 'escalated'

      if (studentDecision === "accepted") {
        complaint.status = "resolved";
        await this.feedbackService.addTimelineEvent(complaint.id!, {
          action: "LEARNER_DECISION",
          actor: "LEARNER",
          message: "Solution accepted",
        });

        // Process refund logic
        if (complaint.refundOption && complaint.refundOption !== "refund_0") {
          let refundAmount = 0;
          const sessionPrice = complaint.enrollment?.amount || complaint.session?.course?.price || complaint.enrollment?.course?.price || complaint.amount || 0;
          if (complaint.refundOption === "refund_100") refundAmount = Number(sessionPrice);
          else if (complaint.refundOption === "refund_50") refundAmount = Number(sessionPrice) / 2;

          if (refundAmount > 0) {
            complaint.amount = refundAmount;
            complaint.refundStatus = "pending";
          }
        } else {
          complaint.refundStatus = "not_applicable";
        }
      } else {
        complaint.status = "escalated";
        await this.feedbackService.addTimelineEvent(complaint.id!, {
          action: "LEARNER_DECISION",
          actor: "LEARNER",
          message: reason || "Solution rejected, escalating to admin",
        });
      }

      const updatedComplaint = await this.feedbackService.updateComplaint(complaint);
      res.status(200).json({
        success: true,
        message: studentDecision === "accepted" ? "Solution accepted" : "Complaint escalated",
        data: {
          id: updatedComplaint?.id,
          status: updatedComplaint?.status,
        }
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "learnerDecision failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  listComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = {
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        role: req.query.role as "learner" | "tutor",
      };

      const userId = req.body.ownerId;
      const { data: complaints, total } = await this.feedbackService.getComplaints(userId, filters);

      const complaintDtos = await enrichDto<ComplaintListDto[]>(ComplaintListDto, complaints);
      setPaginationHeaders(res, total, filters.page, filters.limit);

      res.status(200).json(complaintDtos);
    } catch (error) {
      req.log.error({ err: error, query: req.query }, "listComplaints failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getComplaintDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaint = await this.feedbackService.getComplaintById(req.params.id);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      // Authorization check
      const tutorId = complaint.session?.course?.ownerId || complaint.enrollment?.teacherId || complaint.enrollment?.course?.ownerId;
      if (complaint.studentId !== req.body.ownerId && tutorId !== req.body.ownerId) {
        res.status(403).json({ error: "Unauthorized access to complaint details" });
        return;
      }

      const complaintDto = await enrichDto<ComplaintDto>(ComplaintDto, complaint);
      res.status(200).json(complaintDto);
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "getComplaintDetail failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  respondToComplaint = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaintById = await this.feedbackService.getComplaintById(req.params.id);
      if (!complaintById) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      const tutorId = complaintById.session?.course?.ownerId || complaintById.enrollment?.teacherId || complaintById.enrollment?.course?.ownerId;
      if (tutorId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the tutor can respond to this complaint" });
        return;
      }

      if (complaintById.status !== "pending") {
        res.status(409).json({ error: "Complaint is not in progress or already responded" });
        return;
      }

      complaintById.initialResponse = req.body.message;
      complaintById.refundOption = req.body.proposedRefund ? `refund_${req.body.proposedRefund}` as any : req.body.refundOption;
      complaintById.status = "pending_learner";

      await this.feedbackService.addTimelineEvent(complaintById.id!, {
        action: "TUTOR_REPLY",
        actor: "TUTOR",
        message: req.body.message,
      });

      const updatedComplaint = await this.feedbackService.updateComplaint(complaintById);
      res.status(200).json({
        success: true,
        message: "Response sent successfully",
        data: {
          id: updatedComplaint?.id,
          status: "pending_learner"
        }
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "respondToComplaint failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };


  getTutorIssueStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const tutorId = req.body.ownerId;
      const stats = await this.feedbackService.getTutorIssueStats(tutorId);
      res.status(200).json(stats);
    } catch (error) {
      req.log.error({ err: error, tutorId: req.body.ownerId }, "getTutorIssueStats failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAdminDisputeStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.feedbackService.getAdminDisputeStats();
      res.status(200).json(stats);
    } catch (error) {
      req.log.error({ err: error }, "getAdminDisputeStats failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  adminDecision = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaintId = req.params.id;
      const complaint = await this.feedbackService.getComplaintById(complaintId);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      if (complaint.status !== "escalated") {
        res.status(409).json({ error: "Complaint is not escalated" });
        return;
      }

      complaint.adminResponse = req.body.note;
      complaint.status = "closed";
      complaint.resolvedBy = req.body.ownerId;

      if (req.body.decision === "REFUND") {
        complaint.amount = req.body.refundAmount ?? complaint.enrollment?.amount ?? 0;
        complaint.refundStatus = "pending";
        // Logic to trigger real refund via PaymentService would go here
      }

      await this.feedbackService.addTimelineEvent(complaintId, {
        action: "ADMIN_DECISION",
        actor: "ADMIN",
        message: req.body.note || `Decision: ${req.body.decision}`,
      });

      const updatedComplaint = await this.feedbackService.updateComplaint(complaint);
      res.status(200).json({
        status: "CLOSED",
        refundProcessed: req.body.decision === "REFUND",
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "adminDecision failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const reviews = await this.feedbackService.getAllReviews();
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error }, "getAllReviews failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaints = await this.feedbackService.getAllComplaints();
      const complaintDtos = await enrichDto<ComplaintDto[]>(ComplaintDto, complaints);
      res.status(200).json(complaintDtos);
    } catch (error) {
      req.log.error({ err: error }, "getAllComplaints failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllComplaintsByStudentId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const studentId = req.params.id;
      const complaints = await this.feedbackService.getComplaintsByStudentId(
        studentId
      );
      const complaintDtos = await enrichDto<ComplaintDto[]>(ComplaintDto, complaints);
      res.status(200).json(complaintDtos);
    } catch (error) {
      req.log.error({ err: error, studentId: req.params.id }, "getAllComplaintsByStudentId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // delete complaint
  deleteComplaint = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaintId = req.params.id;
      await this.feedbackService.deleteComplaint(complaintId);
      res.status(204).send();
    } catch (error) {
      req.log.error({ err: error, complaintId: req.params.id }, "deleteComplaint failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get reviews of prerecorded course using pagination
  getReviewsOfPrerecordedCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { data: reviews, total } = await this.feedbackService.getReviewsOfPrerecordedCourses(
        page,
        limit
      );
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      setPaginationHeaders(res, total, page, limit);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error, page: req.query.page, limit: req.query.limit }, "getReviewsOfPrerecordedCourses failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getReviewsByCourseId = async (req: Request, res: Response): Promise<void> => {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const reviews = await this.feedbackService.getReviewsByCourseId(courseId);
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error, courseId: req.params.id }, "getReviewsByCourseId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get reviews by teacher id
  getReviewsByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.teacherId;
      if (!teacherId) {
        res.status(400).json({ error: "Teacher ID is required" });
        return;
      }
      const reviews = await this.feedbackService.getReviewsByTeacherId(
        teacherId
      );
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.teacherId }, "getReviewsByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // create one on one review
  createOneOnOneReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ownerId } = req.body;
      if (!req.body.teacherId) {
        res.status(400).json({ error: "Teacher ID is required" });
        return;
      }
      const reviewBody = {
        ...req.body,
        studentId: ownerId,
      };
      const review = await this.feedbackService.createReview(reviewBody);
      const reviewDto = await enrichDto<ReviewDto>(ReviewDto, review);
      res.status(201).json(reviewDto);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.body.teacherId }, "createOneOnOneReview failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get reviews by one-on-one teacher id
  getReviewsByOneOnOneTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.teacherId;
      const reviews = await this.feedbackService.getReviewsByOneOnOneTeacherId(
        teacherId
      );
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.teacherId }, "getReviewsByOneOnOneTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  // get all reviews by by teacher id
  getAllReviewsByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.teacherId;
      const reviews = await this.feedbackService.getAllReviewsByTeacherId(
        teacherId
      );
      const reviewDtos = await enrichDto<ReviewDto[]>(ReviewDto, reviews);
      res.status(200).json(reviewDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.teacherId }, "getAllReviewsByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getAllComplaintsByTeacherId = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const teacherId = req.params.teacherId;
      const complaints = await this.feedbackService.getComplaintsByTeacherId(
        teacherId
      );
      const complaintDtos = await enrichDto<ComplaintDto[]>(ComplaintDto, complaints);
      res.status(200).json(complaintDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.params.teacherId }, "getAllComplaintsByTeacherId failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
