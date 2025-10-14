import { Request, Response } from "express";
import { CourseService } from "../services/course.service";
import { StreamingService } from "../services/streaming.service";

export class StreamingServiceController {
  private streamingService: StreamingService;
  private courseService: CourseService;

  constructor() {
    this.streamingService = new StreamingService();
    this.courseService = new CourseService();
  }

  createVideoEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({
          error: "You are not authorized to create video for this session",
        });
        return;
      }
      const presignedHeaders = await this.streamingService.createVideoEntry(
        session.title ?? "Untitled"
      );

      res.status(201).json(presignedHeaders);
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.id }, "createVideoEntry failed");
      res.status(500).json({ error: error.message });
    }
  };

  getVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, videoId } = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      const course = await this.courseService.getCourseByIdWithEnrollments(
        session.course?.id ?? ""
      );
      const enrollment = course?.enrollments?.find(
        (enrollment) => enrollment.studentId === req.body.ownerId
      );
      if (
        session.course?.ownerId !== req.body.ownerId &&
        !enrollment?.studentId !== req.body.ownerId
      ) {
        res.status(403).json({
          error: "You are not authorized to access this video",
        });
        return;
      }
      const videoStreamUrl = await this.streamingService.getVideoById(videoId);
      res.status(200).json({ videoStreamUrl });
    } catch (error: any) {
      if (error.message === "Video not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      req.log.error({ err: error, sessionId: req.params.id, videoId: req.params.videoId }, "getVideoById failed");
      res.status(500).json({ error: error.message });
    }
  };

  deleteVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, videoId } = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (session.course?.ownerId !== req.body.ownerId) {
        res.status(403).json({
          error: "You are not authorized to delete video for this session",
        });
        return;
      }
      await this.streamingService.deleteVideoById(videoId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === "Video not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      req.log.error({ err: error, sessionId: req.params.id, videoId: req.params.videoId }, "deleteVideoById failed");
      res.status(500).json({ error: error.message });
    }
  };
}
