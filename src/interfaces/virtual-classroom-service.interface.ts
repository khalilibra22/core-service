export interface VirtualClassroomService {
  createMeeting(meeting: any): Promise<any>;

  joinMeeting(meetingID: string, data?: { fullName: string; password: string; mobile?: boolean }): Promise<string>;

  endMeeting(meetingID: string, data?: any): Promise<any>;

  isMeetingRunning(meetingID: string, data?: any): Promise<boolean>;
}
