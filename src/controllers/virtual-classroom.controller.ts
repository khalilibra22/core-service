import { Request, Response } from "express";
import { VirtualClassroomService } from "../interfaces/virtual-classroom-service.interface";
import { CourseService } from "../services/course.service";
import { publish } from "../events";

export class VirtualClassroomController {
  private virtualClassroomService: VirtualClassroomService;
  private courseService: CourseService;

  constructor(virtualClassroomService: VirtualClassroomService) {
    this.virtualClassroomService = virtualClassroomService;
    this.courseService = new CourseService();
  }

  launchMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullname } = req.query;
      if (!fullname || typeof fullname !== 'string') {
        res.status(400).json({ error: "Fullname is required" });
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
      
      // Publish session.started event to notify enrolled students
      const courseId = session.course?.id || session.enrollment?.course?.id;
      if (courseId && session.id) {
        await publish("session.started", {
          courseId,
          sessionId: session.id,
          title: session.title,
          startsAt: session.date?.toISOString(),
        });
        req.log.info({ courseId, sessionId: session.id }, "Published session.started event");
      }
      
      const desktopJoinUrl = await this.virtualClassroomService.joinMeeting(
        session.id ?? "",
        { fullName:fullname, password: "password" }
      );
      const mobileJoinUrl = await this.virtualClassroomService.joinMeeting(
        session.id ?? "",
        { fullName:fullname, password: "password", mobile: true }
      );
      res.status(201).json({ 
        desktopJoinUrl,
        mobileJoinUrl 
      });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.id }, "launchMeeting failed");
      res.status(500).json({ error: error.message });
    }
  };

  endMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
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
        id,
        req.body.moderatorPassword
      );
      if (!deleted) {
        res.status(404).json({ error: "Virtual classroom already ended" });
        return;
      }
      res.status(200).json({ message: "Virtual classroom ended successfully" });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.id }, "endMeeting failed");
      res.status(500).json({ error: error.message });
    }
  };

  isMeetingRunning = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const isRunning = await this.virtualClassroomService.isMeetingRunning(
        id
      );
      res.status(200).json({ isRunning });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.id }, "isMeetingRunning failed");
      res.status(500).json({ error: error.message });
    }
  };

  joinMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { fullname } = req.query;
      if (!fullname || typeof fullname !== 'string') {
        res.status(400).json({ error: "Fullname is required" });
        return;
      }

      // TODO: check if users enrolled in the course // live / group
      const desktopJoinUrl = await this.virtualClassroomService.joinMeeting(id, {
        fullName: fullname,
        password: "password_",
      });
      const mobileJoinUrl = await this.virtualClassroomService.joinMeeting(id, {
        fullName: fullname,
        password: "password_",
        mobile: true
      });
      res.status(200).json({ desktopJoinUrl, mobileJoinUrl });
    } catch (error: any) {
      req.log.error({ err: error, sessionId: req.params.id }, "joinMeeting failed");
      res.status(500).json({ error: error.message });
    }
  };
}
