import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { FeedbackService } from "../services/feedback.service";

export class FeedbackController {
  private feedbackService: FeedbackService;
  private courseService: CoursService;
  constructor() {
    this.feedbackService = new FeedbackService();
    this.courseService = new CoursService();
  }

  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const reviewBody = {
        ...req.body,
        course: course,
      };
      const review = await this.feedbackService.createReview(reviewBody);
      res.status(201).json(review);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async createComplaint(req: Request, res: Response): Promise<void> {
    try {
      const course = await this.courseService.getCourseById(req.params.id);
      if (!course) {
        res.status(404).json({ error: "Course not found" });
        return;
      }
      const session = await this.courseService.getSessionById(
        req.params.sessionId
      );
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const complaintBody = {
        ...req.body,
        session: session,
      };
      const complaint = await this.feedbackService.createComplaint(
        complaintBody
      );
      res.status(201).json(complaint);
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
        res.status(400).json({ error: "Complaint already resolved" });
        return;
      }
      complaint.status = req.body.status;
      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaint
      );
      res.status(200).json(updatedComplaint);
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
      const complaintBody = {
        ...complaint,
        ...req.body,
        status: "resolved",
      };

      const updatedComplaint = await this.feedbackService.updateComplaint(
        complaintBody
      );
      res.status(200).json(updatedComplaint);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const reviews = await this.feedbackService.getAllReviews();
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getAllComplaints(req: Request, res: Response): Promise<void> {
    try {
      const complaints = await this.feedbackService.getAllComplaints();
      res.status(200).json(complaints);
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
      res.status(200).json(complaints);
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
}
