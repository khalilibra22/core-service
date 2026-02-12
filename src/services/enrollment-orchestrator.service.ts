import { EnrollmentService } from "./enrollment.service";
import { HttpService } from "./http.service";
import { NotificationService } from "./notification.service";
import { CourseService } from "./course.service";
import { SessionService } from "./session.service";
import { CourseModel } from "../models/course.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { logger } from "../utils/logger";
import { injectable, inject } from "tsyringe";

@injectable()
export class EnrollmentOrchestratorService {
    constructor(
        @inject(EnrollmentService) private enrollmentService: EnrollmentService,
        @inject(CourseService) private courseService: CourseService,
        @inject(SessionService) private sessionService: SessionService,
        @inject(HttpService) private httpService: HttpService,
        @inject(NotificationService) private notificationService: NotificationService
    ) { }

    async enrollStudentInCourse(
        courseId: string,
        studentId: string,
        fcmToken?: string
    ): Promise<{ enrollment: EnrollmentModel; topic: string }> {
        const course = await this.courseService.getCourseByIdWithEnrollments(courseId);
        if (!course) {
            throw new Error(`Course not found: ${courseId}`);
        }

        this.validateCourseEnrollment(course, studentId);

        const enrollmentBody = {
            studentId,
            course,
            type: "course",
            amount: course.price || 0,
            currency: "DZD",
        } as any;

        const enrollment = await this.enrollmentService.createEnrollment(
            enrollmentBody,
            fcmToken
        );

        if (course.groupId) {
            try {
                await this.httpService.joinChatGroup(course.groupId, studentId);
            } catch (err) {
                logger.warn(
                    { err, courseId, studentId },
                    "Failed to join chat group after enrollment"
                );
            }
        }

        // Auto-subscribe to course notifications
        const topic = `course-${course.id}`;
        if (fcmToken) {
            try {
                await this.notificationService.subscribeTokenToTopic(fcmToken, topic);
                logger.info({ topic, enrollmentId: enrollment.id }, "Auto-subscribed to course topic");
            } catch (err) {
                logger.warn({ err, topic }, "Failed to auto-subscribe to course topic");
            }
        }

        return { enrollment, topic };
    }

    async enrollStudentOneOnOne(payload: {
        teacherId: string;
        studentId: string;
        topicId: number;
        sessionsNumber: number;
        availabilityIds: string[];
        isPaid: boolean;
        fcmToken?: string;
        allowUnavailable?: boolean;
    }): Promise<{ enrollment: EnrollmentModel; topic: string }> {
        const {
            teacherId,
            studentId,
            topicId,
            sessionsNumber,
            availabilityIds,
            fcmToken,
            allowUnavailable,
        } = payload;

        // TODO: Validate payment/free session logic if needed

        if (!availabilityIds || availabilityIds.length === 0) {
            throw new Error("No sessions provided");
        }

        const availabilities = await this.httpService.checkAvailabilities(
            availabilityIds,
            true
        );
        const sessions = this.sessionService.generateSessionsFromAvailabilities(
            availabilities,
            topicId,
            sessionsNumber
        );

        // Create chat group
        let groupId: string | null = null;
        try {
            const student = await LruInMemoryCache.getUserDetails(studentId);
            const teacher = await LruInMemoryCache.getUserDetails(teacherId);
            const studentName = student?.fullname || studentId;
            const teacherName = teacher?.fullname || teacherId;

            groupId = await this.httpService.createChatGroup({
                name: `1 on 1 with ${teacherName} & ${studentName}`,
                type: "one-on-one",
                ownerId: studentId,
                members: [studentId, teacherId],
            });
        } catch (err) {
            logger.warn(
                { err, studentId, teacherId },
                "Error creating chat group for one-on-one enrollment"
            );
        }

        const userTopic = await LruInMemoryCache.getUserTopic(topicId);
        const amount = (userTopic?.price || 0) * sessionsNumber;

        const enrollmentBody = {
            studentId,
            teacherId,
            sessions,
            type: "one-on-one",
            groupId,
            amount,
            currency: "DZD",
        } as any;

        const enrollment = await this.enrollmentService.createEnrollment(
            enrollmentBody
        );
        const topic = `oneonone-${enrollment.id}`;

        // Handle Notifications
        await this.handleOneOnOneNotifications(
            enrollment.id as string,
            topic,
            teacherId,
            fcmToken
        );

        // Update Availabilities
        const availabilityUpdates = availabilityIds.map(id => {
            const sessionsForThisAvailability = sessions.filter(s => s.availabilityId === id);
            if (sessionsForThisAvailability.length === 0) return { availabilityId: id };

            // Get the last session for this availability
            const lastSession = sessionsForThisAvailability.reduce((prev, current) =>
                (prev.date!.getTime() > current.date!.getTime()) ? prev : current
            );

            const reservedUntilDate = new Date(lastSession.date!);
            reservedUntilDate.setMinutes(reservedUntilDate.getMinutes() + (lastSession.duration || 0));

            return {
                availabilityId: id,
                reservedUntil: reservedUntilDate.toISOString()
            };
        });

        await this.httpService.updateAvailabilitiesToUnavailable(availabilityUpdates);

        return { enrollment, topic };
    }

    private validateCourseEnrollment(course: CourseModel, studentId: string) {
        if (course.status !== "published") {
            throw new Error("Course is not published yet or canceled");
        }
        if (course.couresSettings?.isCanceled) {
            throw new Error("Course is canceled");
        }
        if (
            course.enrollments?.some((enrollment) => enrollment.studentId === studentId)
        ) {
            throw new Error("User already enrolled in this course");
        }
        if (course.type === "group" || course.type === "live") {
            if ((course.enrollments?.length ?? 0) >= (course.maxParticipants ?? 0)) {
                throw new Error(
                    `Course is full. Max students: ${course.maxParticipants}`
                );
            }
        }
    }

    private async handleOneOnOneNotifications(
        enrollmentId: string,
        topic: string,
        teacherId: string,
        studentFcmToken?: string
    ) {
        // Subscribe student
        if (studentFcmToken) {
            try {
                await this.notificationService.subscribeTokenToTopic(
                    studentFcmToken,
                    topic
                );
            } catch (err) {
                logger.warn({ err, topic }, "Failed to auto-subscribe to 1:1 topic");
            }
        }

        // Notify Teacher
        try {
            const teacher = await LruInMemoryCache.getUserDetails(teacherId);
            if (teacher?.fcmToken) {
                const teacherTopic = `teacher-${teacherId}`;
                await this.notificationService.subscribeTokenToTopic(
                    teacher.fcmToken,
                    teacherTopic
                );

                const tokens = [teacher.fcmToken, studentFcmToken].filter(
                    (t): t is string => !!t && t.length >= 10
                );

                if (tokens.length > 0) {
                    await this.notificationService.sendToTokens({
                        tokens,
                        title: "One-on-one Scheduled",
                        body: "Your one-on-one sessions have been scheduled.",
                        data: {
                            enrollmentId: enrollmentId,
                            type: "oneonone_created",
                        },
                    } as any);
                }
            }
        } catch (err) {
            logger.warn(
                { err, teacherId },
                "Failed to handle teacher notifications for 1:1"
            );
        }
    }
}
