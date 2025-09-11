import { Request, Response } from "express";
import { VirtualClassroomService } from "../interfaces/virtual-classroom-service.interface";
import { CourseService } from "../services/course.service";

export class VirtualClassroomController {
  private virtualClassroomService: VirtualClassroomService;
  private courseService: CourseService;

  constructor(virtualClassroomService: VirtualClassroomService) {
    this.virtualClassroomService = virtualClassroomService;
    this.courseService = new CourseService();
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
      if (
        session.course?.ownerId !== req.body.ownerId &&
        session.course?.instructorId !== req.body.ownerId &&
        session.enrollment?.teacherId !== req.body.ownerId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to launch this session" });
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
      const { id, meetingId } = req.params;
      const session = await this.courseService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      if (
        session.course?.ownerId !== req.body.ownerId &&
        session.course?.instructorId !== req.body.ownerId &&
        session.enrollment?.teacherId !== req.body.ownerId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to end this session" });
        return;
      }
      const deleted = await this.virtualClassroomService.endMeeting(
        meetingId,
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
      const { meetingId } = req.params;
      const isRunning = await this.virtualClassroomService.isMeetingRunning(
        meetingId
      );
      res.status(200).json({ isRunning });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  joinMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fullName } = req.query;
      if (!fullName) {
        res.status(400).json({ error: "Full name is required" });
        return;
      }
      // const session = await this.courseService.getSessionById(id);
      // if (!session) {
      //   res.status(404).json({ error: "Session not found" });
      //   return;
      // }
      // if (
      //   session.course?.ownerId !== req.body.ownerId &&
      //   session.enrollment?.teacherId !== req.body.ownerId &&
      //   session.enrollment?.studentId !== req.body.ownerId
      // ) {
      //   res
      //     .status(403)
      //     .json({ error: "You are not authorized to join this session" });
      //   return;
      // }

      // TODO: check if users enrolled in the course // live / group
      const joinUrl = await this.virtualClassroomService.joinMeeting(id, {
        fullName,
        password: "password_",
      });
      res.status(200).json({ joinUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
}
