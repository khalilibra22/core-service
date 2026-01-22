import { Request, Response } from "express";
import { SessionTimeRequestService } from "../services/session-time-request.service";
import { CourseService } from "../services/course.service";
import { plainToInstance } from "class-transformer";
import { SessionTimeChangeRequestDto } from "../dtos/session-time-change-request.dto";
import { enrichDto } from "../utils";
import { HttpService } from "../services/http.service";

export class SessionTimeRequestController {
  private sessionTimeRequestService: SessionTimeRequestService;
  private courseService: CourseService;
  private externalService: HttpService;

  constructor() {
    this.sessionTimeRequestService = new SessionTimeRequestService();
    this.courseService = new CourseService();
    this.externalService = new HttpService();
  }

  private getNextOccurrence(dayOfWeek: string, startTime: string): Date {
    const dayOfWeekMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    const targetDay = dayOfWeekMap[dayOfWeek.toLowerCase()];
    const resultDate = new Date();
    const currentDay = resultDate.getDay();

    const [hours, minutes] = startTime.split(":").map(Number);

    // Set time first to compare with current time
    resultDate.setHours(hours, minutes, 0, 0);

    const diff = (targetDay + 7 - currentDay) % 7;

    if (diff === 0) {
      // If it's today, check if the time has already passed or if we want to force next week for buffer
      // For now, if the time hasn't passed, use today.
      if (resultDate.getTime() <= Date.now()) {
        resultDate.setDate(resultDate.getDate() + 7);
      }
    } else {
      resultDate.setDate(resultDate.getDate() + diff);
    }

    return resultDate;
  }

  createSessionTimeRequest = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { availabilityId, reason, ownerId } = req.body;
      const session = await this.courseService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      if (ownerId !== session.enrollment?.studentId) {
        res.status(403).json({ error: "Only the student can request a time change" });
        return;
      }

      if (!availabilityId) {
        res.status(400).json({ error: "Availability ID is required" });
        return;
      }

      const availabilities = await this.externalService.checkAvailabilities([availabilityId]);
      if (!availabilities || availabilities.length === 0) {
        res.status(404).json({ error: "Availability not found or not available" });
        return;
      }

      const availability = availabilities[0];
      const requestedDate = this.getNextOccurrence(
        availability.dayOfWeek,
        availability.startTime
      );

      const sessionTimeRequestBody = {
        session: session,
        userId: ownerId,
        requestedTime: requestedDate,
        availabilityId: availabilityId,
        reason: reason,
        status: "pending"
      };

      const sessionTimeRequest =
        await this.sessionTimeRequestService.createSessionTimeRequest(
          sessionTimeRequestBody as any
        );
      const sessionTimeRequestDto = await enrichDto<SessionTimeChangeRequestDto>(
        SessionTimeChangeRequestDto,
        sessionTimeRequest
      );
      res.status(201).json(sessionTimeRequestDto);
    } catch (error) {
      req.log.error({ err: error, sessionId: req.params.id }, "createSessionTimeRequest failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  changeSessionTimeRequestStatus = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { status, ownerId } = req.body;
      const sessionTimeRequest =
        await this.sessionTimeRequestService.getSessionTimeRequestById(
          req.params.id
        );

      if (!sessionTimeRequest) {
        res.status(404).json({ error: "Session time request not found" });
        return;
      }

      if (ownerId !== sessionTimeRequest?.session?.enrollment?.teacherId) {
        res.status(403).json({ error: "Only the teacher can treat this request" });
        return;
      }

      if (["approved", "rejected"].includes(sessionTimeRequest.status ?? "")) {
        res.status(409).json({
          error: `Session time request already ${sessionTimeRequest.status}`,
        });
        return;
      }

      if (status === "approved") {
        if (!sessionTimeRequest.availabilityId) {
          res.status(400).json({ error: "Request is missing availability ID" });
          return;
        }

        // Check if availability is still valid
        const availabilities = await this.externalService.checkAvailabilities([
          sessionTimeRequest.availabilityId,
        ]);
        if (!availabilities || availabilities.length === 0) {
          res
            .status(409)
            .json({ error: "Availability is no longer available" });
          return;
        }

        const availability = availabilities[0];
        // Recalculate the nearest future occurrence at approval time
        const finalScheduledTime = this.getNextOccurrence(
          availability.dayOfWeek,
          availability.startTime
        );

        if (sessionTimeRequest.session) {
          sessionTimeRequest.session.date = finalScheduledTime;
        }
        sessionTimeRequest.requestedTime = finalScheduledTime;

        await this.externalService.updateAvailabilitiesToUnavailable([
          sessionTimeRequest.availabilityId,
        ]);
      }

      sessionTimeRequest.status = status;

      const updatedSessionTimeRequest =
        await this.sessionTimeRequestService.updateSessionTimeRequest(
          sessionTimeRequest
        );
      res
        .status(200)
        .json({ message: `Session time request ${status} successfully` });
    } catch (error) {
      req.log.error({ err: error, requestId: req.params.id }, "changeSessionTimeRequestStatus failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getSessionTimeRequests = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { sessionId, status } = req.query as any;
      const userId = req.body.ownerId; // From token
      const requests = await this.sessionTimeRequestService.getAllSessionTimeRequests({
        sessionId,
        status,
        userId,
      });

      const requestDtos = await Promise.all(
        requests.map(async (request) => {
          return await enrichDto<SessionTimeChangeRequestDto>(
            SessionTimeChangeRequestDto,
            request
          );
        })
      );

      res.status(200).json(requestDtos);
    } catch (error) {
      req.log.error({ err: error }, "getSessionTimeRequests failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
