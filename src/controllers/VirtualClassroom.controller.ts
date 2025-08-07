import { Request, Response } from "express";
import { VirtualClassroomService } from "../interfaces/virtualClassroomService.interface";

export class VirtualClassroomController {
  private virtualClassroomService: VirtualClassroomService;

  constructor(virtualClassroomService: VirtualClassroomService) {
    this.virtualClassroomService = virtualClassroomService;
  }

  createMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const virtualClassroom = await this.virtualClassroomService.createMeeting(
        req.body
      );
      res.status(201).json(virtualClassroom);
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
      const { fullName, password } = req.body;
      const { id: meetingID } = req.params;
      const joinUrl = await this.virtualClassroomService.joinMeeting(
        meetingID,
        { fullName, password }
      );
      res.status(200).json({ joinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
