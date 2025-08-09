import { Request, Response } from "express";
import { VirtualClassroomService } from "../interfaces/virtualClassroomService.interface";
import { CoursService } from "../services/course.service";

export class VirtualClassroomController {
  private virtualClassroomService: VirtualClassroomService;
  private courseService: CoursService;

  constructor(virtualClassroomService: VirtualClassroomService) {
    this.virtualClassroomService = virtualClassroomService;
    this.courseService = new CoursService();
  }

  launchMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName } = req.query;
      if (!fullName) {
        res.status(400).json({ error: "Full name is required" });
        return;
      }
      const session = await this.courseService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      const meetingData = {
        meetingID: session.id,
        name: session.title,
        moderatorPW: "password",
        attendeePW: "password_",
      };
      await this.virtualClassroomService.createMeeting(meetingData);
      const moderatorJoinUrl = await this.virtualClassroomService.joinMeeting(
        session.id ?? "",
        { fullName, password: "password" }
      );
      res.status(201).json({ moderatorJoinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  endMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await this.virtualClassroomService.endMeeting(
        id,
        req.body.moderatorPassword
      );
      if (!deleted) {
        res.status(404).json({ error: "Virtual classroom already ended" });
        return;
      }
      res.status(200).json({ message: "Virtual classroom ended successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  isMeetingRunning = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const isRunning = await this.virtualClassroomService.isMeetingRunning(id);
      res.status(200).json({ isRunning });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  joinMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id: meetingID } = req.params;
      const { fullName } = req.query;
      if (!fullName) {
        res.status(400).json({ error: "Full name is required" });
        return;
      }
      const joinUrl = await this.virtualClassroomService.joinMeeting(
        meetingID,
        { fullName, password: "password_" }
      );
      res.status(200).json({ joinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
