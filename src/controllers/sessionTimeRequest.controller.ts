import { Request, Response } from "express";
import { SessionTimeRequestService } from "../services/sessionTimeRequest.service";
import { CourseService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { SessionTimeChangeRequestDto } from "../dtos/sessionTimeChangeRequest.dto";

export class SessionTimeRequestController {
  private sessionTimeRequestService: SessionTimeRequestService;
  private courseService: CourseService;

  constructor() {
    this.sessionTimeRequestService = new SessionTimeRequestService();
    this.courseService = new CourseService();
  }

  createSessionTimeRequest = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const session = await this.courseService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      req.body.userId = req.body.ownerId;
      delete req.body.ownerId;
      if (
        req.body.userId !== session.enrollment?.teacherId &&
        req.body.userId !== session.enrollment?.studentId
      ) {
        res.status(403).json({ error: "You are not authorized" });
        return;
      }
      const sessionTimeRequestBody = {
        ...req.body,
        session: session,
      };

      const sessionTimeRequest =
        await this.sessionTimeRequestService.createSessionTimeRequest(
          sessionTimeRequestBody
        );
      const sessionTimeRequestDto = plainToInstance(
        SessionTimeChangeRequestDto,
        sessionTimeRequest,
        {
          excludeExtraneousValues: true,
        }
      );
      res.status(201).json(sessionTimeRequestDto);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  changeSessionTimeRequestStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const sessionTimeRequest =
        await this.sessionTimeRequestService.getSessionTimeRequestById(
          req.params.id
        );
      const userId =
        sessionTimeRequest?.userId ===
        sessionTimeRequest?.session?.enrollment?.studentId
          ? sessionTimeRequest?.session?.enrollment?.teacherId
          : sessionTimeRequest?.session?.enrollment?.studentId;
      if (req.body.ownerId !== userId) {
        res.status(403).json({ error: "You are not authorized" });
        return;
      }
      if (!sessionTimeRequest) {
        res.status(404).json({ error: "Session time request not found" });
        return;
      }
      if (["approved", "rejected"].includes(sessionTimeRequest.status ?? "")) {
        res.status(409).json({
          error: `Session time request already ${sessionTimeRequest.status}`,
        });
        return;
      }
      const status = req.body.status;
      if (status === "approved") {
        if (sessionTimeRequest.session) {
          sessionTimeRequest.session.date = sessionTimeRequest.requestedTime;
        }
      }
      sessionTimeRequest.status = req.body.status;

      const updatedSessionTimeRequest =
        await this.sessionTimeRequestService.updateSessionTimeRequest(
          sessionTimeRequest
        );
      res
        .status(200)
        .json({ message: "Session time request status updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
