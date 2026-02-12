import { injectable, inject } from "tsyringe";
import { plainToInstance } from "class-transformer";
import { CourseModel } from "../models/course.model";
import { SessionModel } from "../models/session.model";
import { GroupClassDto } from "../dtos/group-class.dto";
import { LiveCourseDto } from "../dtos/live-course.dto";
import { PrerecordedCourseDto } from "../dtos/prerecorded-course.dto";
import { MinimalCourseDto } from "../dtos/minimal-course.dto";
import { SessionDto } from "../dtos/session.dto";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { FeedbackService } from "./feedback.service";
import { logger } from "../utils/logger";
import { MinimalUser, Subject, Topic } from "../types/user.types";

@injectable()
export class DtoService {
    constructor(
        @inject(FeedbackService) private feedbackService: FeedbackService
    ) { }

    /**
     * Enrich and transform CourseModel(s) to DTOs
     */
    async getCourseDto(
        courses: CourseModel | CourseModel[],
        type: string
    ): Promise<any> {
        try {
            const list = Array.isArray(courses) ? courses : [courses];

            // Collect unique IDs for batch fetching
            const userIds = Array.from(
                new Set(
                    list.flatMap((c) =>
                        [c.ownerId, c.instructorId].filter(Boolean) as string[]
                    )
                )
            );

            const topicIds = Array.from(
                new Set(
                    list.flatMap((c) =>
                        [
                            c?.couresSettings?.topicId,
                            ...(c?.sessions ?? []).map((s) => s?.topicId),
                        ].filter(Boolean) as number[]
                    )
                )
            );

            const subjectIds = Array.from(
                new Set(list.map((c) => c.subjectId).filter(Boolean) as number[])
            );

            // Batch fetch from cache and service
            const [usersArr, topicsArr, subjectsArr] = await Promise.all([
                Promise.all(userIds.map((id) => LruInMemoryCache.getUserDetails(id))),
                Promise.all(topicIds.map((id) => LruInMemoryCache.getTopic(id))),
                Promise.all(subjectIds.map((id) => LruInMemoryCache.getSubject(id))),
            ]);

            const userById: Record<string, MinimalUser | null> = {};
            usersArr.forEach((u, i) => {
                userById[userIds[i]] = u;
            });

            const topicById: Record<number, Topic | null> = {};
            topicsArr.forEach((t, i) => {
                topicById[topicIds[i]] = t;
            });

            const subjectById: Record<number, Subject | null> = {};
            subjectsArr.forEach((s, i) => {
                subjectById[subjectIds[i]] = s;
            });

            // Fetch owner ratings and review counts via FeedbackService
            const ownerRatingById: Record<string, number> = {};
            const ownerReviewsCountById: Record<string, number> = {};

            if (userIds.length > 0) {
                await Promise.all(
                    userIds.map(async (userId) => {
                        const [rating, count] = await Promise.all([
                            this.feedbackService.calculateTeacherAverageRating(userId),
                            this.feedbackService.getTeacherReviewsCount(userId),
                        ]);
                        ownerRatingById[userId] = rating;
                        ownerReviewsCountById[userId] = count;
                    })
                );
            }

            const options = {
                excludeExtraneousValues: true,
                context: {
                    userById,
                    topicById,
                    subjectById,
                    ownerRatingById,
                    ownerReviewsCountById,
                },
            };

            let result: any;
            switch (type) {
                case "group":
                    result = plainToInstance(GroupClassDto, courses, options);
                    break;
                case "live":
                    result = plainToInstance(LiveCourseDto, courses, options);
                    break;
                case "prerecorded":
                    result = plainToInstance(PrerecordedCourseDto, courses, options);
                    break;
                default:
                    result = plainToInstance(MinimalCourseDto, courses, options);
                    break;
            }
            return result;
        } catch (error) {
            logger.error({ err: error }, "Error enriching course DTO");
            // Fallback: return DTO without enrichment
            const fallbackClass =
                type === "group"
                    ? GroupClassDto
                    : type === "live"
                        ? LiveCourseDto
                        : type === "prerecorded"
                            ? PrerecordedCourseDto
                            : MinimalCourseDto;
            return plainToInstance(fallbackClass, courses, {
                excludeExtraneousValues: true,
            });
        }
    }

    /**
     * Generic enrichment for DTOs
     */
    async enrichDto<T>(
        DtoClass: any,
        data: any | any[],
        options: {
            userIdFields?: string[];
            topicIdFields?: string[];
            subjectIdFields?: string[];
        } = {}
    ): Promise<T> {
        try {
            const list = Array.isArray(data) ? data : [data];
            const userIdFields = options.userIdFields ?? ["userId", "studentId", "teacherId", "ownerId"];
            const topicIdFields = options.topicIdFields ?? ["topicId"];
            const subjectIdFields = options.subjectIdFields ?? ["subjectId"];

            // Helper for nested path extraction
            const getNestedValue = (obj: any, path: string) => {
                return path.split(".").reduce((acc, part) => acc && acc[part], obj);
            };

            // Extract unique IDs
            const userIds = Array.from(
                new Set(
                    list.flatMap((item) =>
                        userIdFields
                            .map((field) => getNestedValue(item, field))
                            .filter(Boolean) as string[]
                    )
                )
            );

            const topicIds = Array.from(
                new Set(
                    list.flatMap((item) =>
                        topicIdFields
                            .map((field) => getNestedValue(item, field))
                            .filter(Boolean) as number[]
                    )
                )
            );

            const subjectIds = Array.from(
                new Set(
                    list.flatMap((item) =>
                        subjectIdFields
                            .map((field) => getNestedValue(item, field))
                            .filter(Boolean) as number[]
                    )
                )
            );

            // Fetch from cache
            const [usersArr, topicsArr, subjectsArr] = await Promise.all([
                Promise.all(userIds.map((id) => LruInMemoryCache.getUserDetails(id))),
                Promise.all(topicIds.map((id) => LruInMemoryCache.getTopic(id))),
                Promise.all(subjectIds.map((id) => LruInMemoryCache.getSubject(id))),
            ]);

            const userById: Record<string, MinimalUser | null> = {};
            usersArr.forEach((u, i) => {
                userById[userIds[i]] = u;
            });

            const topicById: Record<number, Topic | null> = {};
            topicsArr.forEach((t, i) => {
                topicById[topicIds[i]] = t;
            });

            const subjectById: Record<number, Subject | null> = {};
            subjectsArr.forEach((s, i) => {
                subjectById[subjectIds[i]] = s;
            });

            const transformOptions = {
                excludeExtraneousValues: true,
                context: { userById, topicById, subjectById },
            };

            return plainToInstance(DtoClass, data, transformOptions) as T;
        } catch (error) {
            logger.error({ err: error }, "Error enriching generic DTO");
            return plainToInstance(DtoClass, data, {
                excludeExtraneousValues: true,
            }) as T;
        }
    }

    /**
     * Enrich and transform SessionModel(s) to DTOs
     */
    async getSessionDto(
        sessions: SessionModel | SessionModel[],
        type: string = "minimal"
    ): Promise<any> {
        try {
            const list = Array.isArray(sessions) ? sessions : [sessions];
            const topicIds = Array.from(
                new Set(list.map((s) => s.topicId).filter(Boolean) as number[])
            );

            const topicsArr = await Promise.all(
                topicIds.map((id) => LruInMemoryCache.getTopic(id))
            );

            const topicById: Record<number, Topic | null> = {};
            topicsArr.forEach((t, i) => {
                topicById[topicIds[i]] = t;
            });

            const options = {
                excludeExtraneousValues: true,
                context: { topicById },
            };

            return plainToInstance(SessionDto, sessions, options);
        } catch (error) {
            logger.error({ err: error }, "Error enriching session DTO");
            return plainToInstance(SessionDto, sessions, {
                excludeExtraneousValues: true,
            });
        }
    }
}
