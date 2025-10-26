// Event types for the event-driven notification system

export type EnrollmentCreated = {
  courseId: string;
  userId: string;
  enrollmentId: string;
  courseTitle?: string;
};

export type SessionStarted = {
  courseId?: string;
  enrollmentId?: string;
  sessionId: string;
  title?: string;
  startsAt?: string;
};

export type EventMap = {
  "enrollment.created": EnrollmentCreated;
  "session.started": SessionStarted;
};

export type EventName = keyof EventMap;

