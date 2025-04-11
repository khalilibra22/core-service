import { Request, Response } from "express";
import { SessionTimeRequestService } from "../services/sessionTimeRequest.service";
import { CoursService } from "../services/course.service";

export class SessionTimeRequestController {
  private sessionTimeRequestService: SessionTimeRequestService;
  private courseService: CoursService;

  constructor() {
    this.sessionTimeRequestService = new SessionTimeRequestService();
    this.courseService = new CoursService();
  }

  async createSessionTimeRequest(req: Request, res: Response): Promise<void> {
    try {
      const session = await this.courseService.getSessionById(
        req.params.sessionId
      );
      if (!session) {
        res.status(404).json({ error: "Session not found" });
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
      res.status(201).json(sessionTimeRequest);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async changeSessionTimeRequestStatus(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const sessionTimeRequest =
        await this.sessionTimeRequestService.getSessionTimeRequestById(
          req.params.id
        );
      if (!sessionTimeRequest) {
        res.status(404).json({ error: "Session time request not found" });
        return;
      }
      if (["accepted", "rejected"].includes(sessionTimeRequest.status ?? "")) {
        res.status(400).json({
          error: `Session time request already ${sessionTimeRequest.status}`,
        });
        return;
      }
      const status = req.body.status;
      if (status === "accepted") {
        if (sessionTimeRequest.session) {
          sessionTimeRequest.session.date = sessionTimeRequest.requestedTime;
        }
      }
      sessionTimeRequest.status = req.body.status;

      const updatedSessionTimeRequest =
        await this.sessionTimeRequestService.updateSessionTimeRequest(
          sessionTimeRequest
        );
      res.status(200).json(updatedSessionTimeRequest);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
