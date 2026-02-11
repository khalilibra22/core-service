import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { SessionTimeRequestService } from "../services/session-time-request.service";
import { CourseService } from "../services/course.service";
import { SessionService } from "../services/session.service";
import { HttpService } from "../services/http.service";
import { plainToInstance } from "class-transformer";
import { SessionTimeChangeRequestDto } from "../dtos/session-time-change-request.dto";
import { DtoService } from "../services/dto.service";
import { UserRole } from "../enums/user-roles.enum";

@injectable()
export class SessionTimeRequestController {
  constructor(
    @inject(SessionTimeRequestService) private sessionTimeRequestService: SessionTimeRequestService,
    @inject(CourseService) private courseService: CourseService,
    @inject(SessionService) private sessionService: SessionService,
    @inject(HttpService) private externalService: HttpService,
    @inject(DtoService) private dtoService: DtoService
  ) { }

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
      const { availabilityId, availabilityException, reason, ownerId, userRole } = req.body;
      const session = await this.sessionService.getSessionById(req.params.id);
      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const isStudent = userRole === UserRole.STUDENT;
      const isTeacher = userRole === UserRole.TEACHER || userRole === UserRole.ACADEMY_TEACHER || userRole === UserRole.ACADEMY;

      if (
        (isStudent && ownerId !== session.enrollment?.studentId) ||
        (isTeacher && ownerId !== session.enrollment?.teacherId) ||
        (!isStudent && !isTeacher)
      ) {
        res.status(403).json({ error: "You are not authorized to request a time change for this session" });
        return;
      }

      let requestedDate: Date | undefined;

      // If student is requesting, they MUST provide either availabilityId OR availabilityException
      if (isStudent) {
        if ((!availabilityId && !availabilityException) || (availabilityId && availabilityException)) {
          res.status(400).json({ error: "Provide either availabilityId or availabilityException, not both/neither" });
          return;
        }

        if (availabilityId) {
          const availabilities = await this.externalService.checkAvailabilities([availabilityId]);
          if (!availabilities || availabilities.length === 0) {
            res.status(404).json({ error: "Availability not found or not available" });
            return;
          }

          const availability = availabilities[0];
          requestedDate = this.getNextOccurrence(
            availability.dayOfWeek,
            availability.startTime
          );
        } else {
          requestedDate = new Date(availabilityException);
          if (isNaN(requestedDate.getTime())) {
            res.status(400).json({ error: "Invalid availabilityException date" });
            return;
          }
        }
      }

      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + 72);

      const sessionTimeRequestBody = {
        session: session,
        userId: ownerId,
        requestedTime: requestedDate,
        availabilityId: availabilityId,
        availabilityException: availabilityException ? new Date(availabilityException) : undefined,
        reason: reason,
        status: "pending",
        expirationDate: expirationDate
      };

      const sessionTimeRequest =
        await this.sessionTimeRequestService.createSessionTimeRequest(
          sessionTimeRequestBody as any
        );
      const sessionTimeRequestDto = await this.dtoService.enrichDto<SessionTimeChangeRequestDto>(
        SessionTimeChangeRequestDto,
        sessionTimeRequest,
        { topicIdFields: ["session.topicId"] }
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
      const { status, ownerId, userRole } = req.body;
      const sessionTimeRequest =
        await this.sessionTimeRequestService.getSessionTimeRequestById(
          req.params.id
        );

      if (!sessionTimeRequest) {
        res.status(404).json({ error: "Session time request not found" });
        return;
      }

      const isStudent = userRole === UserRole.STUDENT;
      const isTeacher = userRole === UserRole.TEACHER || userRole === UserRole.ACADEMY_TEACHER || userRole === UserRole.ACADEMY;

      if (!isStudent && !isTeacher) {
        res.status(403).json({ error: "You are not authorized" });
        return;
      }

      // Authorization: Check if user is part of the enrollment and NOT the requester
      if (ownerId === sessionTimeRequest.userId) {
        res.status(403).json({ error: "You cannot treat your own request" });
        return;
      }

      const enrollment = sessionTimeRequest.session?.enrollment;
      if (ownerId !== enrollment?.studentId && ownerId !== enrollment?.teacherId) {
        res.status(403).json({ error: "You are not part of this enrollment" });
        return;
      }

      if (["approved", "rejected"].includes(sessionTimeRequest.status ?? "")) {
        res.status(409).json({
          error: `Session time request already ${sessionTimeRequest.status}`,
        });
        return;
      }

      if (status === "approved") {
        const effectiveAvailabilityId = sessionTimeRequest.availabilityId || req.body.availabilityId;
        const effectiveException = sessionTimeRequest.availabilityException || (req.body.availabilityException ? new Date(req.body.availabilityException) : undefined);

        if (!effectiveAvailabilityId && !effectiveException) {
          res.status(400).json({ error: "Availability ID or Exception date is required to approve" });
          return;
        }

        if (effectiveAvailabilityId && effectiveException) {
          res.status(400).json({ error: "Provide either availabilityId or availabilityException, not both" });
          return;
        }

        let finalScheduledTime: Date;

        if (effectiveAvailabilityId) {
          // Check if availability is still valid
          const availabilities = await this.externalService.checkAvailabilities([
            effectiveAvailabilityId,
          ]);
          if (!availabilities || availabilities.length === 0) {
            res
              .status(409)
              .json({ error: "Availability is no longer available" });
            return;
          }

          const availability = availabilities[0];
          // Recalculate the nearest future occurrence at approval time
          finalScheduledTime = this.getNextOccurrence(
            availability.dayOfWeek,
            availability.startTime
          );

          await this.externalService.updateAvailabilitiesToUnavailable([
            { availabilityId: effectiveAvailabilityId },
          ]);
          sessionTimeRequest.availabilityId = effectiveAvailabilityId;
          sessionTimeRequest.availabilityException = undefined; // Clear exception if ID is used
        } else {
          finalScheduledTime = effectiveException!;
          if (isNaN(finalScheduledTime.getTime())) {
            res.status(400).json({ error: "Invalid exception date" });
            return;
          }
          sessionTimeRequest.availabilityException = finalScheduledTime;
          sessionTimeRequest.availabilityId = undefined; // Clear ID if exception is used
        }

        if (sessionTimeRequest.session) {
          sessionTimeRequest.session.date = finalScheduledTime;
        }
        sessionTimeRequest.requestedTime = finalScheduledTime;
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
          return await this.dtoService.enrichDto<SessionTimeChangeRequestDto>(
            SessionTimeChangeRequestDto,
            request,
            { topicIdFields: ["session.topicId"] }
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
