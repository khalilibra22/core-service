export interface IVirtualClassroomService {
  createMeeting(meeting: {
    meetingName: string;
    meetingID: string;
    moderatorPassword: string;
    attendeePassword: string;
    duration?: string;
  }): Promise<any>;

  joinMeeting(
    fullName: string,
    meetingID: string,
    password: string
  ): Promise<string>;

  endMeeting(meetingID: string, moderatorPassword: string): Promise<any>;

  isMeetingRunning(meetingID: string): Promise<boolean>;
}
