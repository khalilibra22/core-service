import { plainToInstance } from "class-transformer";
import { CourseModel } from "../models/course.model";
import { GroupClassDto } from "../dtos/groupClass.dto";
import { LiveCourseDto } from "../dtos/liveCourse.dto";
import { MinimalCourseDto } from "../dtos/minimalCourse.dto";
import { PrerecordedCourseDto } from "../dtos/prerecordedCourse.dto";
import { SessionModel } from "../models/session.model";
import { SessionDto } from "../dtos/session.dto";
import { RecordedSessionDto } from "../dtos/recordedSession.dto";

export const getCourseDto = (
  courses: CourseModel | CourseModel[],
  type: string
): any => {
  switch (type) {
    case "group":
      return plainToInstance(GroupClassDto, courses, {
        excludeExtraneousValues: true,
      });
    case "live":
      return plainToInstance(LiveCourseDto, courses, {
        excludeExtraneousValues: true,
      });
    case "prerecorded":
      return plainToInstance(PrerecordedCourseDto, courses, {
        excludeExtraneousValues: true,
      });
    default:
      return plainToInstance(MinimalCourseDto, courses, {
        excludeExtraneousValues: true,
      });
  }
};

export const getSessionDto = (
  sessions: SessionModel | SessionModel[],
  type: string
): any => {
  switch (type) {
    case "session":
      return plainToInstance(SessionDto, sessions, {
        excludeExtraneousValues: true,
      });
    case "prerecorded":
      return plainToInstance(RecordedSessionDto, sessions, {
        excludeExtraneousValues: true,
      });
    default:
      return plainToInstance(SessionDto, sessions, {
        excludeExtraneousValues: true,
      });
  }
};
