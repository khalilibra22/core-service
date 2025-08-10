import { Request, Response } from "express";
import { CoursService } from "../services/course.service";
import { StreamingService } from "../services/streaming.service";

export class StreamingServiceController {
  private streamingService: StreamingService;
  private courseService: CoursService;

  constructor() {
    this.streamingService = new StreamingService();
    this.courseService = new CoursService();
  }

  createVideoEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      const presignedHeaders = await this.streamingService.createVideoEntry(
        session.title ?? "Untitled"
      );

      res.status(201).json(presignedHeaders);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  getVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      const playerUrl = await this.streamingService.getVideoById(videoId);
      res.status(200).json({ playerUrl });
    } catch (error: any) {
      if (error.message === "Video not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };

  deleteVideoById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { videoId } = req.params;
      await this.streamingService.deleteVideoById(videoId);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === "Video not found") {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  };
}
