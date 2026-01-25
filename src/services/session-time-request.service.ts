import { AppDataSource } from "../config/database";
import { injectable, inject } from "tsyringe";
import { Repository } from "typeorm";
import { logger } from "../utils/logger";
import { SessionTimeChangeRequestModel } from "../models/session-time-change-request.model";

@injectable()
export class SessionTimeRequestService {
  constructor(
    @inject("SessionTimeRequestRepository") private sessionTimeRequestRepo: Repository<SessionTimeChangeRequestModel>
  ) { }

  // Create a new session time change request
  async createSessionTimeRequest(
    sessionTimeRequest: SessionTimeChangeRequestModel
  ): Promise<SessionTimeChangeRequestModel> {
    try {
      return await this.sessionTimeRequestRepo.save(sessionTimeRequest);
    } catch (error) {
      logger.error({ err: error }, "createSessionTimeRequest failed");
      throw new Error("Error creating session time change request");
    }
  }

  // Get session time change request by ID
  async getSessionTimeRequestById(
    id: string
  ): Promise<SessionTimeChangeRequestModel | null> {
    try {
      return await this.sessionTimeRequestRepo.findOne({
        where: {
          id: id,
        },
        relations: ["session", "session.enrollment"],
        cache: {
          id: `session-time-request-${id}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, id }, "getSessionTimeRequestById failed");
      throw new Error("Error fetching session time change request by ID");
    }
  }

  // Get all session time change requests with optional filters
  async getAllSessionTimeRequests(filters?: {
    sessionId?: string;
    status?: string;
    userId?: string;
  }): Promise<SessionTimeChangeRequestModel[]> {
    try {
      let where: any;
      if (filters?.userId) {
        where = [
          { userId: filters.userId },
          { session: { enrollment: { teacherId: filters.userId } } },
        ];

        // Apply additional filters to both OR conditions
        if (filters.sessionId || filters.status) {
          where = where.map((condition: any) => ({
            ...condition,
            ...(filters.sessionId ? { session: { ...condition.session, id: filters.sessionId } } : {}),
            ...(filters.status ? { status: filters.status } : {}),
          }));
        }
      } else {
        where = {};
        if (filters?.sessionId) where.session = { id: filters.sessionId };
        if (filters?.status) where.status = filters.status;
      }

      return await this.sessionTimeRequestRepo.find({
        where,
        relations: ["session", "session.enrollment"],
        order: { createdAt: "DESC" },
        cache: {
          id: `filtered-session-time-requests-${JSON.stringify(filters)}`,
          milliseconds: 300000, // 5 minutes
        },
      });
    } catch (error) {
      logger.error({ err: error, filters }, "getAllSessionTimeRequests failed");
      throw new Error("Error fetching session time change requests");
    }
  }

  // Update session time change request
  async updateSessionTimeRequest(
    sessionTimeRequest: SessionTimeChangeRequestModel
  ): Promise<SessionTimeChangeRequestModel | null> {
    try {
      return await this.sessionTimeRequestRepo.save(sessionTimeRequest);
    } catch (error) {
      logger.error({ err: error }, "updateSessionTimeRequest failed");
      throw new Error("Error updating session time change request");
    }
  }
}
