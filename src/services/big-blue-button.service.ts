import crypto from "crypto";
import axios from "axios";
import { logger } from "../utils/logger";
import { VirtualClassroomService } from "../interfaces/virtual-classroom-service.interface";

export class BigBlueButtonService implements VirtualClassroomService {
  private bbbApiUrl: string;
  private bbbSecret: string;

  constructor() {
    this.bbbApiUrl =
      process.env.BBB_API_URL ||
      "https://biggerbluebutton.com/bigbluebutton/ibrtest12345/api";
    this.bbbSecret =
      process.env.BBB_SECRET || "WpiThAD9tUe7AkQABKQmDIgd3M5XvfgWIjdulDdlOPr";
  }

  async createMeeting(meeting: {
    name: string;
    meetingID: string;
    moderatorPW: string;
    attendeePW: string;
    duration?: string;
  }): Promise<any> {
    try {
      const params = new URLSearchParams(meeting);
      const checksum = this.generateChecksum("create", params.toString());
      const url = `${this.bbbApiUrl
        }/create?${params.toString()}&checksum=${checksum}`;

      const response = await axios.get(url);
      if (typeof response.data === "string" && response.data.includes("<returncode>FAILED</returncode>")) {
        throw new Error(`BigBlueButton API failed to create meeting: ${response.data}`);
      }
      return response.data;
    } catch (error) {
      logger.error({ err: error, meeting }, "createMeeting failed");
      throw new Error(`Failed to create meeting: ${error}`);
    }
  }

  async joinMeeting(
    meetingID: string,
    { fullName, password, mobile }: { fullName: string; password: string; mobile?: boolean }
  ): Promise<string> {
    try {
      const params = new URLSearchParams({
        fullName,
        meetingID,
        password,
        redirect: 'true'
      });
      const checksum = this.generateChecksum("join", params.toString());

      if (mobile) {
        // Generate mobile app URL using bigbluebutton:// scheme
        const baseUrl = this.bbbApiUrl.replace('https://', '').replace('http://', '');
        return `bigbluebutton://${baseUrl}/join?${params.toString()}&checksum=${checksum}`;
      }

      return `${this.bbbApiUrl}/join?${params.toString()}&checksum=${checksum}`;
    } catch (error) {
      logger.error({ err: error, meetingID }, "joinMeeting failed");
      throw new Error(`Failed to join meeting: ${error}`);
    }
  }

  async endMeeting(meetingID: string, moderatorPassword: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        meetingID: meetingID,
        password: moderatorPassword,
      });

      const checksum = this.generateChecksum("end", params.toString());
      const url = `${this.bbbApiUrl
        }/end?${params.toString()}&checksum=${checksum}`;

      const response = await axios.get(url);
      if (typeof response.data === "string" && response.data.includes("<returncode>FAILED</returncode>")) {
        return false;
      }
      return true;
    } catch (error) {
      logger.error({ err: error, meetingID }, "endMeeting failed");
      throw new Error(`Failed to end meeting: ${error}`);
    }
  }

  async isMeetingRunning(meetingID: string): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        meetingID: meetingID,
      });

      const checksum = this.generateChecksum(
        "isMeetingRunning",
        params.toString()
      );
      const url = `${this.bbbApiUrl
        }/isMeetingRunning?${params.toString()}&checksum=${checksum}`;

      const response = await axios.get(url);
      // BBB returns XML, check if running is "true"
      return response.data.includes("<running>true</running>");
    } catch (error) {
      logger.error({ err: error, meetingID }, "isMeetingRunning failed");
      throw new Error(`Failed to check if meeting is running: ${error}`);
    }
  }

  private generateChecksum(apiCall: string, queryString: string): string {
    try {
      const data = apiCall + queryString + this.bbbSecret;
      return crypto.createHash("sha1").update(data).digest("hex");
    } catch (error) {
      logger.error({ err: error, apiCall, queryString }, "generateChecksum failed");
      throw new Error(`Failed to generate checksum: ${error}`);
    }
  }
}
