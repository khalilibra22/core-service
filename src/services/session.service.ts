import { Repository, MoreThanOrEqual, Not } from "typeorm";
import { AppDataSource } from "../config/database";
import { SessionModel } from "../models/session.model";
import { logger } from "../utils/logger";
import { CACHE_KEYS, CACHE_TTL } from "../config/constants";
import { Availability } from "../types/availability.types";
import { injectable, inject } from "tsyringe";

const dayOfWeekMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

@injectable()
export class SessionService {
    constructor(@inject("SessionRepository") private sessionRepo: Repository<SessionModel>) { }

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

                    // Determine the effective start date for this availability
                    let effectiveStartDate = new Date(startDate);
                    if (availability.reservedUntil) {
                        const reservedUntilDate = new Date(availability.reservedUntil);
                        if (reservedUntilDate > effectiveStartDate) {
                            effectiveStartDate = reservedUntilDate;
                        }
                    }

                    // If currentDate is before effectiveStartDate, use effectiveStartDate
                    // But we need to be careful not to regress if we've already advanced past it in the loop
                    let targetDate = new Date(currentDate);
                    if (targetDate < effectiveStartDate) {
                        targetDate = new Date(effectiveStartDate);
                    }

                    const tempDate = new Date(targetDate);

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
                    start.setUTCHours(startHour, startMinute, 0, 0);

                    // Ensure we are truly after reservedUntil (considering time)
                    if (availability.reservedUntil) {
                        const reservedUntilDate = new Date(availability.reservedUntil);
                        if (start <= reservedUntilDate) {
                            // Move to next week
                            tempDate.setDate(tempDate.getDate() + 7);
                            start.setDate(start.getDate() + 7);
                        }
                    }

                    const end = new Date(start);
                    end.setUTCHours(endHour, endMinute, 0, 0);


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
                        availabilityId: availability.id,
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

    async mapSelectedDatesToSessions(
        selectedSessions: { availabilityId: string; date: Date | string }[],
        availabilities: Availability[],
        topicId: number
    ): Promise<SessionModel[]> {
        try {
            // Check for duplicates within the request
            const seen = new Set<string>();
            for (const s of selectedSessions) {
                const key = `${s.availabilityId}-${new Date(s.date).toISOString().split('T')[0]}`;
                if (seen.has(key)) {
                    throw new Error(`Duplicate session requested for availability ${s.availabilityId} on date ${s.date}`);
                }
                seen.add(key);
            }

            const sessions = await Promise.all(selectedSessions.map(async ({ availabilityId, date }) => {
                const availability = availabilities.find((a) => a.id === availabilityId);
                if (!availability) {
                    throw new Error(`Availability not found: ${availabilityId}`);
                }

                // Parse the date string safely to avoid timezone issues.
                // new Date("YYYY-MM-DD") is treated as UTC midnight by JS, so we must
                // extract the parts and construct the date in LOCAL time to correctly
                // represent the user-intended date in the server's local timezone (Africa/Algiers).
                const dateStr = typeof date === "string" ? date : date.toISOString();
                const [yearStr, monthStr, dayStr] = dateStr.split("T")[0].split("-");
                const year = parseInt(yearStr, 10);
                const month = parseInt(monthStr, 10) - 1; // months are 0-indexed
                const day = parseInt(dayStr, 10);

                // Parse start time and end time
                if (!availability.startTime || !availability.endTime) {
                    throw new Error(`Availability ${availabilityId} is missing start or end time`);
                }

                const [startHour, startMinute] = availability.startTime.split(":").map(Number);
                const [endHour, endMinute] = availability.endTime.split(":").map(Number);

                // Build start/end in UTC so that the stored time matches the availability times exactly.
                // Availability startTime/endTime are expressed in UTC (e.g. "18:30" = 18:30 UTC).
                // Using new Date(Date.UTC(...)) avoids the server's +01:00 local offset shifting the time.
                const start = new Date(Date.UTC(year, month, day, startHour, startMinute, 0, 0));
                const end = new Date(Date.UTC(year, month, day, endHour, endMinute, 0, 0));

                // Use the correctly constructed UTC date for validations
                const sessionDate = new Date(Date.UTC(year, month, day));

                // Integrity Check 1: Ensure date is in the future
                if (sessionDate < new Date()) {
                    throw new Error(`Date ${dateStr.split('T')[0]} is in the past`);
                }

                // Integrity Check 2: Ensure the selected date matches the availability's day of week
                const dayName = sessionDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
                if (dayName !== availability.dayOfWeek?.toLowerCase()) {
                    throw new Error(`Date ${dateStr.split('T')[0]} is a ${dayName}, but the availability is for ${availability.dayOfWeek}`);
                }

                // Integrity Check 3: Collision check in database for this specific date
                const existingSession = await this.sessionRepo.findOne({
                    where: {
                        availabilityId: availabilityId,
                        date: start
                    }
                });

                if (existingSession) {
                    throw new Error(`This time slot (${sessionDate.toISOString().split('T')[0]}) is already booked`);
                }

                const durationMs = end.getTime() - start.getTime();
                const durationMinutes = Math.floor(durationMs / (1000 * 60));

                return {
                    date: start,
                    duration: durationMinutes,
                    durationUnit: "minutes",
                    isPaid: !availability.isFree,
                    status: "scheduled",
                    topicId: topicId,
                    availabilityId: availability.id,
                } as SessionModel;
            }));

            return sessions.sort((a, b) => a.date!.getTime() - b.date!.getTime());
        } catch (error: any) {
            logger.error({ err: error }, "Error mapping selected dates to sessions");
            throw new Error(`Failed to map selected dates: ${error.message}`);
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
                cache: false,
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
                cache: false,
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
                cache: false,
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
                relations: ["materialLinks", "materialLinks.material", "enrollment"],
                cache: false,
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
                cache: false,
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
                cache: false,
            });
        } catch (error: any) {
            logger.error({ err: error, courseId }, "getPrerecordedCourseSections failed");
            throw new Error("Error fetching prerecorded course sections: " + error.message);
        }
    }

    async getBookedDatesByAvailability(availabilityId: string): Promise<string[]> {
        try {
            const sessions = await this.sessionRepo.find({
                where: {
                    availabilityId,
                    date: MoreThanOrEqual(new Date()),
                    status: Not("canceled")
                },
                select: ["date"],
            });
            return sessions.map((s) => s.date!.toISOString());
        } catch (error: any) {
            logger.error({ err: error, availabilityId }, "getBookedDatesByAvailability failed");
            throw new Error("Error fetching booked dates: " + error.message);
        }
    }

    async deleteSessionsByEnrollmentId(enrollmentId: string): Promise<void> {
        try {
            await this.sessionRepo.delete({ enrollment: { id: enrollmentId } });
            logger.info({ enrollmentId }, "Deleted sessions associated with enrollment");
        } catch (error) {
            logger.error({ err: error, enrollmentId }, "deleteSessionsByEnrollmentId failed");
            throw new Error("Error deleting sessions by enrollment ID");
        }
    }
}
