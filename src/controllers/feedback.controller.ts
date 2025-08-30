import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { FeedbackService } from "../services/feedback.service";
import { plainToInstance } from "class-transformer";
import { ReviewDto } from "../dtos/review.dto";
import { ComplaintDto } from "../dtos/complaint.dto";

export class FeedbackController {
  private feedbackService: FeedbackService;
  private courseService: CourseService;
  constructor() {
    this.feedbackService = new FeedbackService();
    this.courseService = new CourseService();
  }

  async createCourseReview(req: Request, res: Response): Promise<void> {
    try {
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
      const reviewDto = plainToInstance(ReviewDto, review, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(reviewDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createComplaint(req: Request, res: Response): Promise<void> {
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
      const complaintDto = plainToInstance(ComplaintDto, complaint, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(complaintDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async changeComplaintStatus(req: Request, res: Response): Promise<void> {
    try {
      const complaint = await this.feedbackService.getComplaintById(
        req.params.id
      );
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
        return;
      }
      if (complaint.status === "resolved") {
        res.status(409).json({ error: "Complaint already resolved" });
        return;
      }
      complaint.status = req.body.status;
      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaint
      );
      const complaintDto = plainToInstance(ComplaintDto, updatedComplaint, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(complaintDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async resolveComplaint(req: Request, res: Response): Promise<void> {
    try {
      const complaintId = req.params.id;
      const complaint = await this.feedbackService.getComplaintById(
        complaintId
      );
      if (!complaint) {
        res.status(404).json({ error: "Complaint not found" });
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
      const complaintDto = plainToInstance(ComplaintDto, updatedComplaint, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(complaintDto);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const reviews = await this.feedbackService.getAllReviews();
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllComplaints(req: Request, res: Response): Promise<void> {
    try {
      const complaints = await this.feedbackService.getAllComplaints();
      const complaintDtos = plainToInstance(ComplaintDto, complaints, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(complaintDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllComplaintsByStudentId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const studentId = req.params.id;
      const complaints = await this.feedbackService.getComplaintsByStudentId(
        studentId
      );
      const complaintDtos = plainToInstance(ComplaintDto, complaints, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(complaintDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // delete complaint
  async deleteComplaint(req: Request, res: Response): Promise<void> {
    try {
      const complaintId = req.params.id;
      await this.feedbackService.deleteComplaint(complaintId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get reviews of prerecorded course using pagination
  async getReviewsOfPrerecordedCourses(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const reviews = await this.feedbackService.getReviewsOfPrerecordedCourses(
        page,
        limit
      );
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getReviewsByCourseId(req: Request, res: Response): Promise<void> {
    try {
      const courseId = req.params.id;
      const course = await this.courseService.getCourseById(courseId);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const reviews = await this.feedbackService.getReviewsByCourseId(courseId);
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get reviews by teacher id
  async getReviewsByTeacherId(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId;
      if (!teacherId) {
        res.status(400).json({ error: "Teacher ID is required" });
        return;
      }
      const reviews = await this.feedbackService.getReviewsByTeacherId(
        teacherId
      );
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // create one on one review
  async createOneOnOneReview(req: Request, res: Response): Promise<void> {
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
      const reviewDto = plainToInstance(ReviewDto, review, {
        excludeExtraneousValues: true,
      });
      res.status(201).json(reviewDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get reviews by one-on-one teacher id
  async getReviewsByOneOnOneTeacherId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const teacherId = req.params.teacherId;
      const reviews = await this.feedbackService.getReviewsByOneOnOneTeacherId(
        teacherId
      );
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // get all reviews by by teacher id
  async getAllReviewsByTeacherId(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId;
      if (!teacherId) {
        res.status(400).json({ error: "Teacher ID is required" });
        return;
      }
      const reviews = await this.feedbackService.getAllReviewsByTeacherId(
        teacherId
      );
      const reviewDtos = plainToInstance(ReviewDto, reviews, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(reviewDtos);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
