import { AppDataSource } from "../config/database";
import { SessionTimeChangeRequestModel } from "../models/sessionTimeChangeRequest.model";

export class SessionTimeRequestService {
  sessionTimeRequest: any;

  constructor() {
    this.sessionTimeRequest = AppDataSource.getRepository(
      SessionTimeChangeRequestModel
    );
  }

  // Create a new session time change request
  async createSessionTimeRequest(
    sessionTimeRequest: SessionTimeChangeRequestModel
  ): Promise<SessionTimeChangeRequestModel> {
    try {
      return await this.sessionTimeRequest.save(sessionTimeRequest);
    } catch (error) {
      throw new Error("Error creating session time change request");
    }
  }

  // Get session time change request by ID
  async getSessionTimeRequestById(
    id: string
  ): Promise<SessionTimeChangeRequestModel | null> {
    try {
      return await this.sessionTimeRequest.findOne({
        where: {
          id: id,
        },
        relations: ["session"],
      });
    } catch (error) {
      throw new Error("Error fetching session time change request by ID");
    }
  }

  // Get all session time change requests
  async getAllSessionTimeRequests(): Promise<SessionTimeChangeRequestModel[]> {
    try {
      return await this.sessionTimeRequest.find({
        relations: ["session"],
      });
    } catch (error) {
      throw new Error("Error fetching session time change requests");
    }
  }

  // Update session time change request
  async updateSessionTimeRequest(
    sessionTimeRequest: SessionTimeChangeRequestModel
  ): Promise<SessionTimeChangeRequestModel | null> {
    try {
      return await this.sessionTimeRequest.save(sessionTimeRequest);
    } catch (error) {
      throw new Error("Error updating session time change request");
    }
  }
}
