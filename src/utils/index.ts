import { plainToInstance } from "class-transformer";
import { CourseModel } from "../models/course.model";
import { GroupClassDto } from "../dtos/group-class.dto";
import { LiveCourseDto } from "../dtos/live-course.dto";
import { MinimalCourseDto } from "../dtos/minimal-course.dto";
import { PrerecordedCourseDto } from "../dtos/prerecorded-course.dto";
import { SessionModel } from "../models/session.model";
import { SessionDto } from "../dtos/session.dto";
import { RecordedSessionDto } from "../dtos/recorded-session.dto";
import { Availability } from "../types/availability.types";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { MinimalUser, UserTopic } from "../types/user.types";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

export const getCourseDto = async (
  courses: CourseModel | CourseModel[],
  type: string
): Promise<any> => {
  try {
    const list = Array.isArray(courses) ? courses : [courses];

    // Collect unique user IDs (ownerId, instructorId)
    const userIds = Array.from(
      new Set(
        list.flatMap(c => [c.ownerId, c.instructorId].filter(Boolean) as string[])
      )
    );

    // Collect unique topic IDs from course settings and sessions
    const topicIds = Array.from(
      new Set(
        list.flatMap(c => [
          c?.couresSettings?.topicId,
          ...(c?.sessions ?? []).map(s => s?.topicId)
        ].filter(Boolean) as number[])
      )
    );

    // Batch fetch users and topics from cache
    const [usersArr, topicsArr] = await Promise.all([
      Promise.all(userIds.map(id => LruInMemoryCache.getUserDetails(id))),
      Promise.all(topicIds.map(id => LruInMemoryCache.getUserTopic(id)))
    ]);

    // Build lookup maps as plain objects (not Maps) for class-transformer compatibility
    const userById: Record<string, MinimalUser | null> = {};
    usersArr.forEach((u, i) => {
      userById[userIds[i]] = u;
    });

    const topicById: Record<number, UserTopic | null> = {};
    topicsArr.forEach((t, i) => {
      topicById[topicIds[i]] = t;
    });

    const options = {
      excludeExtraneousValues: true,
      context: { userById, topicById }
    };

    switch (type) {
      case "group":
        return plainToInstance(GroupClassDto, courses, options);
      case "live":
        return plainToInstance(LiveCourseDto, courses, options);
      case "prerecorded":
        return plainToInstance(PrerecordedCourseDto, courses, options);
      default:
        return plainToInstance(MinimalCourseDto, courses, options);
    }
  } catch (error) {
    try {
      const { logger } = require("./logger");
      logger.error({ err: error }, "Error enriching course DTO from cache");
    } catch (_) {}
    // Fallback: return DTO without enrichment
    return plainToInstance(
      type === "group" ? GroupClassDto : 
      type === "live" ? LiveCourseDto : 
      type === "prerecorded" ? PrerecordedCourseDto : MinimalCourseDto, 
      courses, 
      { excludeExtraneousValues: true }
    );
  }
};

export const getSessionDto = async (
  sessions: SessionModel | SessionModel[],
  type: string
): Promise<any> => {
  try {
    const list = Array.isArray(sessions) ? sessions : [sessions];

    // Collect unique topic IDs from sessions
    const topicIds = Array.from(
      new Set(list.map(s => s?.topicId).filter(Boolean) as number[])
    );

    // Batch fetch topics from cache
    const topicsArr = await Promise.all(
      topicIds.map(id => LruInMemoryCache.getUserTopic(id))
    );

    // Build lookup as plain object
    const topicById: Record<number, UserTopic | null> = {};
    topicsArr.forEach((t, i) => {
      topicById[topicIds[i]] = t;
    });

    const options = {
      excludeExtraneousValues: true,
      context: { topicById }
    };

    switch (type) {
      case "session":
        return plainToInstance(SessionDto, sessions, options);
      case "prerecorded":
        return plainToInstance(RecordedSessionDto, sessions, options);
      default:
        return plainToInstance(SessionDto, sessions, options);
    }
  } catch (error) {
    try {
      const { logger } = require("./logger");
      logger.error({ err: error }, "Error enriching session DTO from cache");
    } catch (_) {}
    // Fallback: return DTO without enrichment
    return plainToInstance(
      type === "prerecorded" ? RecordedSessionDto : SessionDto,
      sessions,
      { excludeExtraneousValues: true }
    );
  }
};

// Helper to enrich any DTO with user/topic data from cache
export async function enrichDto<T>(
  DtoClass: any,
  data: any | any[],
  options?: { userIdFields?: string[]; topicIdFields?: string[] }
): Promise<T> {
  try {
    const list = Array.isArray(data) ? data : [data];
    const userIdFields = options?.userIdFields ?? ['studentId', 'teacherId', 'userId', 'ownerId'];
    const topicIdFields = options?.topicIdFields ?? ['topicId'];

    // Collect unique user IDs
    const userIds = Array.from(
      new Set(
        list.flatMap(item => 
          userIdFields.map(field => item?.[field]).filter(Boolean) as string[]
        )
      )
    );

    // Collect unique topic IDs
    const topicIds = Array.from(
      new Set(
        list.flatMap(item =>
          topicIdFields.map(field => item?.[field]).filter(Boolean) as number[]
        )
      )
    );

    // Batch fetch users and topics from cache
    const [usersArr, topicsArr] = await Promise.all([
      userIds.length > 0 ? Promise.all(userIds.map(id => LruInMemoryCache.getUserDetails(id))) : [],
      topicIds.length > 0 ? Promise.all(topicIds.map(id => LruInMemoryCache.getUserTopic(id))) : []
    ]);

    // Build lookup as plain objects
    const userById: Record<string, MinimalUser | null> = {};
    usersArr.forEach((u, i) => {
      userById[userIds[i]] = u;
    });

    const topicById: Record<number, UserTopic | null> = {};
    topicsArr.forEach((t, i) => {
      topicById[topicIds[i]] = t;
    });

    return plainToInstance(DtoClass, data, {
      excludeExtraneousValues: true,
      context: { userById, topicById }
    }) as T;
  } catch (error) {
    try {
      const { logger } = require("./logger");
      logger.error({ err: error }, "Error enriching DTO from cache");
    } catch (_) {}
    // Fallback: return DTO without enrichment
    return plainToInstance(DtoClass, data, {
      excludeExtraneousValues: true
    }) as T;
  }
}

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
  availabilities: Availability[],
  topic_id: number,
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
          status: "scheduled",
          topicId: topic_id,
        });
      }

      // Move to the next week to repeat availabilities
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return sessions.slice(0, numberOfSessions); // In case we overshoot
  } catch (error) {
    try {
      const { logger } = require("./logger");
      logger.error({ err: error }, "Error generating sessions");
    } catch (_) {}
    throw new Error("Failed to generate sessions from availabilities");
  }
}

export const handleMulterError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          error: "File too large",
          message: "File size exceeds the 10MB limit",
        });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          error: "Too many files",
          message: "Only one file is allowed per upload",
        });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected field",
          message: 'Unexpected file field. Expected field name: "file"',
        });
      default:
        return res.status(400).json({
          error: "Upload error",
          message:
            error.message || 'Field name missing. Expected field name: "file"',
        });
    }
  }
  next(error);
};

export const getVideoThumbnail = (videoId: string) =>
  `${process.env.BUNNY_CDN_HOSTNAME}/${videoId}/thumbnail.jpg`;

export const getPermanentUrl = (storageId: string): string => {
  // Generate permanent URL for public-read files
  return `${process.env.S3_READ_URL}/${storageId}`;
}

export const setPaginationHeaders = (
  res: Response,
  total: number,
  page: number,
  limit: number
): void => {
  res.setHeader("X-Total-Count", total.toString());
  res.setHeader("X-Page", page.toString());
  res.setHeader("X-Limit", limit.toString());
}
