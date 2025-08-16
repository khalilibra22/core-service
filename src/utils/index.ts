import { plainToInstance } from "class-transformer";
import { CourseModel } from "../models/course.model";
import { GroupClassDto } from "../dtos/groupClass.dto";
import { LiveCourseDto } from "../dtos/liveCourse.dto";
import { MinimalCourseDto } from "../dtos/minimalCourse.dto";
import { PrerecordedCourseDto } from "../dtos/prerecordedCourse.dto";
import { SessionModel } from "../models/session.model";
import { SessionDto } from "../dtos/session.dto";
import { RecordedSessionDto } from "../dtos/recordedSession.dto";
import { AvailabilityDto } from "../dtos/availability.dto";

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

// interface Session {
//   date: Date;
//   duration: number;
//   durationUnit: 'minutes';
// }

const dayOfWeekMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Generate sessions based on availabilities and number of sessions needed
 */
export function generateSessionsFromAvailabilities(
  availabilities: AvailabilityDto[],
  numberOfSessions: number,
  startDate: Date = new Date()
): SessionModel[] {
  try {
    const sessions: SessionModel[] = [];

    // Sort to keep consistency
    const sortedAvailabilities = availabilities.filter(
      (a) => a.dayOfWeek && a.startTime && a.endTime
    );

    let currentDate = new Date(startDate);

    while (sessions.length < numberOfSessions) {
      for (const availability of sortedAvailabilities) {
        if (sessions.length >= numberOfSessions) break;

        const dayIndex = dayOfWeekMap[availability.dayOfWeek!.toLowerCase()];
        const tempDate = new Date(currentDate);

        // Adjust date to the next correct weekday
        const daysToAdd = (7 + dayIndex - tempDate.getDay()) % 7;
        tempDate.setDate(tempDate.getDate() + daysToAdd);

        // Parse start time and end time
        const [startHour, startMinute] = availability
          .startTime!.split(":")
          .map(Number);
        const [endHour, endMinute] = availability
          .endTime!.split(":")
          .map(Number);

        const start = new Date(tempDate);
        start.setHours(startHour, startMinute, 0, 0);

        const end = new Date(tempDate);
        end.setHours(endHour, endMinute, 0, 0);

        const durationMs = end.getTime() - start.getTime();
        if (durationMs <= 0) continue;

        const durationMinutes = Math.floor(durationMs / (1000 * 60));

        sessions.push({
          date: new Date(start),
          duration: durationMinutes,
          durationUnit: "minutes",
          isPaid: !availability.isFree,
        });
      }

      // Move to the next week to repeat availabilities
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return sessions.slice(0, numberOfSessions); // In case we overshoot
  } catch (error) {
    console.error("Error generating sessions:", error);
    throw new Error("Failed to generate sessions from availabilities");
  }
}
