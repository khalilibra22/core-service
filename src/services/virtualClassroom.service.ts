import crypto from "crypto";
import axios from "axios";

export class VirtualClassroomService {
  private bbbApiUrl: string;
  private bbbSecret: string;

  constructor() {
    this.bbbApiUrl =
      process.env.BBB_API_URL ||
      "https://biggerbluebutton.com/bigbluebutton/ibrtest12345/api";
    this.bbbSecret =
      process.env.BBB_SECRET || "WpiThAD9tUe7AkQABKQmDIgd3M5XvfgWIjdulDdlOPr";
  }

  async createMeeting(
    meetingID: string,
    meetingName: string,
    moderatorPassword: string,
    attendeePassword: string,
    duration: number
  ): Promise<any> {
    const params = new URLSearchParams({
      name: meetingName,
      meetingID: meetingID,
      moderatorPW: moderatorPassword,
      attendeePW: attendeePassword,
      welcome: `Welcome to ${meetingName}`,
      record: "false",
      duration: duration ? duration.toString() : "0",
    });

    const checksum = this.generateChecksum("create", params.toString());
    const url = `${
      this.bbbApiUrl
    }/create?${params.toString()}&checksum=${checksum}`;

    const response = await axios.get(url);
    return response.data;
  }

  async joinMeeting(
    fullName: string,
    meetingID: string,
    password: string
  ): Promise<string> {
    const params = new URLSearchParams({
      fullName: fullName,
      meetingID: meetingID,
      password: password,
    });

    const checksum = this.generateChecksum("join", params.toString());
    return `${this.bbbApiUrl}/join?${params.toString()}&checksum=${checksum}`;
  }

  async endMeeting(meetingID: string, moderatorPassword: string): Promise<any> {
    const params = new URLSearchParams({
      meetingID: meetingID,
      password: moderatorPassword,
    });

    const checksum = this.generateChecksum("end", params.toString());
    const url = `${
      this.bbbApiUrl
    }/end?${params.toString()}&checksum=${checksum}`;

    const response = await axios.get(url);
    return response.data;
  }

  private generateChecksum(apiCall: string, queryString: string): string {
    const data = apiCall + queryString + this.bbbSecret;
    return crypto.createHash("sha1").update(data).digest("hex");
  }

  async isMeetingRunning(meetingID: string): Promise<boolean> {
    const params = new URLSearchParams({
      meetingID: meetingID,
    });

    const checksum = this.generateChecksum(
      "isMeetingRunning",
      params.toString()
    );
    const url = `${
      this.bbbApiUrl
    }/isMeetingRunning?${params.toString()}&checksum=${checksum}`;

    try {
      const response = await axios.get(url);
      // BBB returns XML, check if running is "true"
      return response.data.includes("<running>true</running>");
    } catch (error) {
      return false;
    }
  }
}
