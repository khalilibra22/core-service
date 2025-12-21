import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { FeedbackService } from "../services/feedback.service";
import { ReviewDto } from "../dtos/review.dto";
import { ComplaintDto } from "../dtos/complaint.dto";
import { ComplaintListDto } from "../dtos/complaint-list.dto";
import { enrichDto, setPaginationHeaders } from "../utils";

export class FeedbackController {
  private feedbackService: FeedbackService;
  private courseService: CourseService;
  constructor() {
    this.feedbackService = new FeedbackService();
    this.courseService = new CourseService();
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
      const sessionId = req.params.id;
      const session = await this.courseService.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      req.body.studentId = req.body.ownerId;
      delete req.body.ownerId;

      const complaintBody = {
        ...req.body,
        session: session,
      };
      const complaint = await this.feedbackService.createComplaint(
        complaintBody
      );
      const complaintDto = await enrichDto<ComplaintDto>(ComplaintDto, complaint);
      res.status(201).json(complaintDto);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "createComplaint failed");
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

  complaintStudentDecision = async (
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
      if (complaint.studentId !== req.body.ownerId) {
        res
          .status(403)
          .json({ error: "You are not the owner of this complaint" });
        return;
      }
      if (complaint.status !== "responded") {
        res.status(409).json({ error: "Decision already sent or complaint not responded" });
        return;
      }
      complaint.studentDecision = req.body.studentDecision;
      req.body.studentDecision === "accepted"
        ? (complaint.status = "resolved")
        : (complaint.status = "escalated");

      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaint
      );

      // If accepted and refund > 0, set amount and refundStatus
      if (req.body.studentDecision === "accepted" && updatedComplaint?.refundOption && updatedComplaint.refundOption !== "refund_0") {
        let amount = 0;
        const sessionPrice = updatedComplaint.session?.course?.price || updatedComplaint.enrollment?.course?.price || updatedComplaint.amount || 0;
        if (updatedComplaint.refundOption === "refund_100") amount = Number(sessionPrice);
        else if (updatedComplaint.refundOption === "refund_50") amount = Number(sessionPrice) / 2;

        if (amount > 0) {
          updatedComplaint.amount = amount;
          updatedComplaint.refundStatus = "pending";
          await this.feedbackService.updateComplaint(updatedComplaint);
        }
      } else if (req.body.studentDecision === "accepted") {
        updatedComplaint!.refundStatus = "not_applicable";
        await this.feedbackService.updateComplaint(updatedComplaint!);
      }

      const complaintDto = await enrichDto<ComplaintDto>(ComplaintDto, updatedComplaint);
      res.status(200).json(complaintDto);
    } catch (error) {
      req.log.error({ err: error, complaintId: req.params.id }, "complaintStudentDecision failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  listComplaints = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = req.query.role as "learner" | "tutor";
      if (!role || (role !== "learner" && role !== "tutor")) {
        res.status(400).json({ error: "role (learner or tutor) is required" });
        return;
      }

      const filters = {
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
      };

      const userId = req.body.ownerId;
      const { data: complaints, total } = await this.feedbackService.getComplaints(role, userId, filters);

      const complaintDtos = await enrichDto<ComplaintListDto[]>(ComplaintListDto, complaints);
      setPaginationHeaders(res, total, filters.page, filters.limit);

      res.status(200).json({
        success: true,
        data: {
          complaints: complaintDtos,
          pagination: {
            current_page: filters.page,
            total_pages: Math.ceil(total / filters.limit),
            total_count: total
          }
        }
      });
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
      res.status(200).json({
        success: true,
        data: complaintDto
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "getComplaintDetail failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  respondToComplaint = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaint = await this.feedbackService.getComplaintById(req.params.id);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      const tutorId = complaint.session?.course?.ownerId || complaint.enrollment?.teacherId || complaint.enrollment?.course?.ownerId;
      if (tutorId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the tutor can respond to this complaint" });
        return;
      }

      if (complaint.status !== "pending") {
        res.status(409).json({ error: "Complaint is not in progress or already responded" });
        return;
      }

      complaint.initialResponse = req.body.message;
      complaint.refundOption = req.body.refundOption;
      complaint.status = "responded";

      const updatedComplaint = await this.feedbackService.updateComplaint(complaint);
      res.status(200).json({
        success: true,
        message: "Response sent successfully",
        data: {
          id: updatedComplaint?.id,
          status: "responded" // Client document says awaiting_learner but model uses responded, I'll return what matches client but keep responded in DB for consistency
        }
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "respondToComplaint failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  acceptSolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaint = await this.feedbackService.getComplaintById(req.params.id);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      if (complaint.studentId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the student can accept the solution" });
        return;
      }

      if (complaint.status !== "responded") {
        res.status(409).json({ error: "Complaint is not awaiting learner decision" });
        return;
      }

      complaint.studentDecision = "accepted";
      complaint.status = "resolved"; // Document says resolved then closed, I'll set to resolved
      // feedback is optional in request body

      const updatedComplaint = await this.feedbackService.updateComplaint(complaint);

      let refundAmount = 0;
      if (updatedComplaint?.refundOption && updatedComplaint.refundOption !== "refund_0") {
        const sessionPrice = updatedComplaint.session?.course?.price || updatedComplaint.enrollment?.course?.price || updatedComplaint.amount || 0;
        if (updatedComplaint.refundOption === "refund_100") refundAmount = Number(sessionPrice);
        else if (updatedComplaint.refundOption === "refund_50") refundAmount = Number(sessionPrice) / 2;

        if (refundAmount > 0) {
          updatedComplaint.amount = refundAmount;
          updatedComplaint.refundStatus = "pending";
          await this.feedbackService.updateComplaint(updatedComplaint);
        }
      } else {
        updatedComplaint!.refundStatus = "not_applicable";
        await this.feedbackService.updateComplaint(updatedComplaint!);
      }

      res.status(200).json({
        success: true,
        message: "Solution accepted",
        data: {
          id: updatedComplaint?.id,
          status: "resolved",
          refund_amount: refundAmount,
          refund_status: refundAmount > 0 ? "pending" : "none"
        }
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "acceptSolution failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  rejectSolution = async (req: Request, res: Response): Promise<void> => {
    try {
      const complaint = await this.feedbackService.getComplaintById(req.params.id);
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }

      if (complaint.studentId !== req.body.ownerId) {
        res.status(403).json({ error: "Only the student can reject the solution" });
        return;
      }

      if (complaint.status !== "responded") {
        res.status(409).json({ error: "Complaint is not awaiting learner decision" });
        return;
      }

      complaint.studentDecision = "escalated";
      complaint.status = "escalated";
      // reason is required in request body

      const updatedComplaint = await this.feedbackService.updateComplaint(complaint);
      res.status(200).json({
        success: true,
        message: "Complaint escalated to administration",
        data: {
          id: updatedComplaint?.id,
          status: "escalated"
        }
      });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "rejectSolution failed");
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
