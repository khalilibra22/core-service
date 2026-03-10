import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { VirtualClassroomService } from "../interfaces/virtual-classroom-service.interface";
import { SessionService } from "../services/session.service";
import { publish } from "../events";
import { BigBlueButtonService } from "../services/big-blue-button.service";
import crypto from "crypto";

@injectable()
export class VirtualClassroomController {
  constructor(
    @inject(BigBlueButtonService) private virtualClassroomService: VirtualClassroomService,
    @inject(SessionService) private sessionService: SessionService
  ) { }

  launchMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullname } = req.query;
      if (!fullname || typeof fullname !== 'string') {
        res.status(400).json({ error: "Fullname is required" });
        return;
      }
      const session = await this.sessionService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const ownerId = res.locals.ownerId || req.body.ownerId;
      if (
        session.course?.ownerId !== ownerId &&
        session.course?.instructorId !== ownerId &&
        session.enrollment?.teacherId !== ownerId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to launch this session" });
        return;
      }

      // Generate deterministic passwords based on session ID
      const bbbSecret = process.env.BBB_SECRET || "WpiThAD9tUe7AkQABKQmDIgd3M5XvfgWIjdulDdlOPr";
      const moderatorPW = crypto.createHmac("sha256", bbbSecret).update(`${session.id}_mod`).digest("hex").substring(0, 12);
      const attendeePW = crypto.createHmac("sha256", bbbSecret).update(`${session.id}_att`).digest("hex").substring(0, 12);

      const isRunning = await this.virtualClassroomService.isMeetingRunning(session.id ?? "");

      if (!isRunning) {
        const meetingData = {
          meetingID: session.id!,
          name: session.title ?? "Virtual Classroom",
          moderatorPW,
          attendeePW,
        };
        await this.virtualClassroomService.createMeeting(meetingData);

        // Publish session.started event to notify enrolled students
        const courseId = session.course?.id || session.enrollment?.course?.id;
        const enrollmentId = session.enrollment?.id;

        if ((courseId || enrollmentId) && session.id) {
          await publish("session.started", {
            courseId,
            enrollmentId,
            sessionId: session.id,
            title: session.title,
            startsAt: session.date?.toISOString(),
          });
          req.log?.info({ courseId, enrollmentId, sessionId: session.id }, "Published session.started event");
        }
      }

      const desktopJoinUrl = await this.virtualClassroomService.joinMeeting(
        session.id ?? "",
        { fullName: fullname, password: moderatorPW }
      );
      const mobileJoinUrl = await this.virtualClassroomService.joinMeeting(
        session.id ?? "",
        { fullName: fullname, password: moderatorPW, mobile: true }
      );
      res.status(200).json({
        desktopJoinUrl,
        mobileJoinUrl
      });
    } catch (error: any) {
      req.log?.error({ err: error, sessionId: req.params.id }, "launchMeeting failed");
      res.status(500).json({ error: error.message });
    }
  };

  endMeeting = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const session = await this.sessionService.getSessionById(id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const ownerId = res.locals.ownerId || req.body.ownerId;
      if (
        session.course?.ownerId !== ownerId &&
        session.course?.instructorId !== ownerId &&
        session.enrollment?.teacherId !== ownerId
      ) {
        res
          .status(403)
          .json({ error: "You are not authorized to end this session" });
        return;
      }

      const bbbSecret = process.env.BBB_SECRET || "WpiThAD9tUe7AkQABKQmDIgd3M5XvfgWIjdulDdlOPr";
      const moderatorPW = crypto.createHmac("sha256", bbbSecret).update(`${session.id}_mod`).digest("hex").substring(0, 12);

      const deleted = await this.virtualClassroomService.endMeeting(
        id,
        moderatorPW
      );
      if (!deleted) {
        res.status(404).json({ error: "Virtual classroom already ended or not found" });
        return;
      }
      res.status(200).json({ message: "Virtual classroom ended successfully" });
    } catch (error: any) {
      req.log?.error({ err: error, sessionId: req.params.id }, "endMeeting failed");
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
      req.log?.error({ err: error, sessionId: req.params.id }, "isMeetingRunning failed");
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

      const isRunning = await this.virtualClassroomService.isMeetingRunning(id);
      if (!isRunning) {
        res.status(404).json({ error: "Virtual classroom session has not started yet" });
        return;
      }

      const bbbSecret = process.env.BBB_SECRET || "WpiThAD9tUe7AkQABKQmDIgd3M5XvfgWIjdulDdlOPr";
      const attendeePW = crypto.createHmac("sha256", bbbSecret).update(`${id}_att`).digest("hex").substring(0, 12);

      const desktopJoinUrl = await this.virtualClassroomService.joinMeeting(id, {
        fullName: fullname,
        password: attendeePW,
      });
      const mobileJoinUrl = await this.virtualClassroomService.joinMeeting(id, {
        fullName: fullname,
        password: attendeePW,
        mobile: true
      });
      res.status(200).json({ desktopJoinUrl, mobileJoinUrl });
    } catch (error: any) {
      req.log?.error({ err: error, sessionId: req.params.id }, "joinMeeting failed");
      res.status(500).json({ error: error.message });
    }
  };
}
