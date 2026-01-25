import { Repository } from "typeorm";
import { AppDataSource } from "../config/database";
import { SessionModel } from "../models/session.model";
import { logger } from "../utils/logger";
import { CACHE_KEYS, CACHE_TTL } from "../config/constants";
import { Availability } from "../types/availability.types";

const dayOfWeekMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

export class SessionService {
    private sessionRepo: Repository<SessionModel>;

    constructor(repo?: Repository<SessionModel>) {
        this.sessionRepo = repo || AppDataSource.getRepository(SessionModel);
    }

    generateSessionsFromAvailabilities(
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
            logger.error({ err: error }, "Error generating sessions");
            throw new Error("Failed to generate sessions from availabilities");
        }
    }

    async createSession(session: SessionModel): Promise<SessionModel> {
        try {
            return await this.sessionRepo.save(session);
        } catch (error: any) {
            logger.error({ err: error }, "createSession failed");
            throw new Error("Error creating session: " + error.message);
        }
    }

    async getSessionById(id: string): Promise<SessionModel | null> {
        try {
            return await this.sessionRepo.findOne({
                where: { id },
                relations: ["course", "enrollment"],
                cache: {
                    id: CACHE_KEYS.SESSION(id),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error) {
            logger.error({ err: error, id }, "getSessionById failed");
            throw new Error("Error fetching session by ID");
        }
    }

    async updateSession(session: SessionModel): Promise<SessionModel> {
        try {
            return await this.sessionRepo.save(session);
        } catch (error: any) {
            logger.error({ err: error }, "updateSession failed");
            throw new Error("Error updating session: " + error.message);
        }
    }

    async deleteSession(id: string): Promise<void> {
        try {
            await this.sessionRepo.softDelete(id);
        } catch (error: any) {
            logger.error({ err: error, id }, "deleteSession failed");
            throw new Error("Error deleting session");
        }
    }

    async getCourseSessions(courseId: string): Promise<SessionModel[]> {
        try {
            return await this.sessionRepo.find({
                where: { course: { id: courseId } },
                cache: {
                    id: CACHE_KEYS.COURSE_SESSIONS(courseId),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error) {
            logger.error({ err: error, courseId }, "getCourseSessions failed");
            throw new Error("Error fetching course sessions");
        }
    }

    async getTeacherOneOnOneSessions(teacherId: string): Promise<SessionModel[]> {
        try {
            return await this.sessionRepo.find({
                where: { enrollment: { teacherId } },
                relations: ["materialLinks", "materialLinks.material"],
                cache: {
                    id: CACHE_KEYS.TEACHER_ONE_ON_ONE_SESSIONS(teacherId),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error) {
            logger.error({ err: error, teacherId }, "getTeacherOneOnOneSessions failed");
            throw new Error("Error fetching one on one sessions by teacher ID");
        }
    }

    async getOneOnOneSessionsByEnrollmentId(enrollmentId: string): Promise<SessionModel[]> {
        try {
            return await this.sessionRepo.find({
                where: { enrollment: { id: enrollmentId } },
                relations: ["materialLinks", "materialLinks.material"],
                cache: {
                    id: CACHE_KEYS.ENROLLMENT_SESSIONS(enrollmentId),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error) {
            logger.error({ err: error, enrollmentId }, "getOneOnOneSessionsByEnrollmentId failed");
            throw new Error("Error fetching one on one sessions by enrollment ID");
        }
    }

    async getPrerecordedSessionDetails(id: string): Promise<SessionModel | null> {
        try {
            return await this.sessionRepo.findOne({
                where: { id },
                relations: ["lessons", "lessons.materialLinks", "lessons.materialLinks.material", "quizzes", "course"],
                cache: {
                    id: CACHE_KEYS.PRERECORDED_SESSION(id),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error: any) {
            logger.error({ err: error, id }, "getPrerecordedSessionDetails failed");
            throw new Error("Error fetching prerecorded session details: " + error.message);
        }
    }

    async getPrerecordedCourseSections(courseId: string): Promise<SessionModel[]> {
        try {
            return await this.sessionRepo.find({
                where: { course: { id: courseId } },
                relations: ["lessons", "lessons.materialLinks", "lessons.materialLinks.material", "quizzes"],
                cache: {
                    id: CACHE_KEYS.PRERECORDED_COURSE_SECTIONS(courseId),
                    milliseconds: CACHE_TTL.STATIC_CONTENT,
                },
            });
        } catch (error: any) {
            logger.error({ err: error, courseId }, "getPrerecordedCourseSections failed");
            throw new Error("Error fetching prerecorded course sections: " + error.message);
        }
    }
}
