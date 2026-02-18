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

interface EnrollmentResult {
    enrollment: EnrollmentModel;
    topic: string;
    paymentUrl?: string;
    transactionId?: string;
}

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
        fcmToken?: string,
        method: string = "satim"
    ): Promise<EnrollmentResult> {
        const course = await this.courseService.getCourseByIdWithEnrollments(courseId);
        if (!course) {
            throw new Error(`Course not found: ${courseId}`);
        }

        this.validateCourseEnrollment(course, studentId);

        const enrollmentBody = {
            studentId,
            course,
            type: "course",
            status: "pending_payment",
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

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        // Handle Payment
        const paymentResult = await this.initiatePaymentFlow(
            studentId,
            course.price || 0,
            "COURSE_ENROLLMENT",
            enrollment.id!,
            `Enrollment in course '${course.name}'`,
            `${frontendUrl}/enrollment/${enrollment.id}/success`, // TODO: Config
            `${frontendUrl}/enrollment/${enrollment.id}/fail`,
            method,
            { teacherId: course.ownerId, courseType: course.type }
        );

        if (paymentResult) {
            return { enrollment, topic, ...paymentResult };
        }
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
        sessions?: { availabilityId: string; date: Date | string }[];
        isPaid: boolean;
        fcmToken?: string;
        allowUnavailable?: boolean;
        method?: string;
    }): Promise<EnrollmentResult> {
        const {
            teacherId,
            studentId,
            topicId,
            sessionsNumber,
            availabilityIds,
            sessions: manualSessions,
            fcmToken,
            method = "satim",
        } = payload;

        const effectiveAvailabilityIds = manualSessions
            ? Array.from(new Set(manualSessions.map(s => s.availabilityId)))
            : availabilityIds;

        if (!effectiveAvailabilityIds || effectiveAvailabilityIds.length === 0) {
            throw new Error("No sessions provided");
        }

        const availabilities = await this.httpService.checkAvailabilities(
            effectiveAvailabilityIds,
            true
        );

        const sessions = manualSessions
            ? await this.sessionService.mapSelectedDatesToSessions(manualSessions, availabilities, topicId)
            : this.sessionService.generateSessionsFromAvailabilities(
                availabilities,
                topicId,
                sessionsNumber
            );

        const effectiveSessionsNumber = manualSessions ? manualSessions.length : sessionsNumber;

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
        const amount = (userTopic?.price || 0) * effectiveSessionsNumber;

        const enrollmentBody = {
            studentId,
            teacherId,
            sessions,
            type: "one-on-one",
            groupId,
            status: "pending_payment",
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
        const availabilityUpdates = effectiveAvailabilityIds.map(id => {
            const sessionsForThisAvailability = sessions.filter(s => s.availabilityId === id);
            if (sessionsForThisAvailability.length === 0) return { availabilityId: id };

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

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

        // Handle Payment
        const paymentResult = await this.initiatePaymentFlow(
            studentId,
            amount,
            "ONE_ON_ONE_ENROLLMENT",
            enrollment.id!,
            `1-on-1 sessions for topic '${userTopic?.topic?.name || topicId}'`,
            `${frontendUrl}/enrollment/${enrollment.id}/success`,
            `${frontendUrl}/enrollment/${enrollment.id}/fail`,
            method,
            { teacherId, courseType: "one_on_one" }
        );

        if (paymentResult) {
            return { enrollment, topic, ...paymentResult };
        }

        return { enrollment, topic };
    }

    private async initiatePaymentFlow(
        userId: string,
        amount: number,
        referenceType: string,
        referenceId: string,
        description: string,
        returnUrl: string,
        failUrl: string,
        method: string = "satim",
        metadata?: any
    ): Promise<{ paymentUrl?: string; transactionId: string } | null> {
        if (!amount || amount <= 0) {
            return null;
        }

        const paymentResponse = await this.httpService.initiatePayment({
            userId,
            amount,
            currency: "DZD",
            method,
            referenceType,
            referenceId,
            description,
            returnUrl,
            failUrl,
            metadata
        });

        return {
            paymentUrl: paymentResponse.paymentUrl,
            transactionId: paymentResponse.transactionId,
        };
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
            const activeEnrollmentsCount = course.enrollments?.filter(
                e => e.status === "approved" || e.status === "pending_payment"
            ).length ?? 0;

            if (activeEnrollmentsCount >= (course.maxParticipants ?? 0)) {
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

    async handlePaymentWebhook(payload: {
        transactionId: string;
        referenceId: string;
        referenceType: string;
        status: "success" | "failed";
    }): Promise<void> {
        const { referenceId, status, transactionId } = payload;

        logger.info({ referenceId, status, transactionId }, "Handling payment webhook");

        const enrollment = await this.enrollmentService.getEnrollmentById(referenceId);
        if (!enrollment) {
            logger.error({ referenceId }, "Enrollment not found for webhook");
            throw new Error(`Enrollment not found: ${referenceId}`);
        }

        if (status === "success") {
            enrollment.status = "approved";
            enrollment.paymentStatus = "paid";
            enrollment.paymentId = transactionId;
        } else {
            enrollment.status = "rejected";
            enrollment.paymentStatus = "failed";
            await this.releaseEnrollmentResources(enrollment);
        }

        await this.enrollmentService.updateEnrollment(enrollment);
        logger.info({ enrollmentId: enrollment.id, status: enrollment.status }, "Enrollment status updated via webhook");
    }

    async cancelAndRefund(enrollmentId: string, canceledBy: string, reason: string): Promise<void> {
        logger.info({ enrollmentId, canceledBy, reason }, "Canceling and refunding enrollment");

        const enrollment = await this.enrollmentService.getEnrollmentById(enrollmentId);
        if (!enrollment) throw new Error("Enrollment not found");

        if (enrollment.status === "canceled" || enrollment.status === "refunded") {
            throw new Error("Enrollment is already canceled or refunded");
        }

        // 1. Update Enrollment Status
        enrollment.status = "canceled";
        enrollment.canceledBy = canceledBy;
        enrollment.cancellationReason = reason;
        await this.enrollmentService.updateEnrollment(enrollment);

        // 2. Process Virtual Refund to Student Wallet
        // Only if it was paid
        if (enrollment.paymentStatus === "paid" && enrollment.amount && enrollment.amount > 0) {
            await this.httpService.refundToWallet({
                userId: enrollment.studentId as string,
                amount: enrollment.amount as number,
                referenceType: enrollment.type === "one-on-one" ? "ONE_ON_ONE_ENROLLMENT" : "COURSE_ENROLLMENT",
                referenceId: enrollment.id!
            });
            enrollment.status = "refunded";
            await this.enrollmentService.updateEnrollment(enrollment);
            logger.info({ enrollmentId, studentId: enrollment.studentId }, "Refund issued to student wallet");
        }

        // 3. Release resources
        await this.releaseEnrollmentResources(enrollment);

        // 4. Notify participants? (TODO)
    }

    private async releaseEnrollmentResources(enrollment: EnrollmentModel): Promise<void> {
        logger.info({ enrollmentId: enrollment.id, type: enrollment.type }, "Releasing enrollment resources");

        if (enrollment.type === "one-on-one") {
            try {
                // Get availability IDs from sessions before deleting them
                const sessions = await this.sessionService.getOneOnOneSessionsByEnrollmentId(enrollment.id!);
                const availabilityIds = Array.from(new Set(sessions.map(s => s.availabilityId).filter((id): id is string => !!id)));

                // Delete sessions
                await this.sessionService.deleteSessionsByEnrollmentId(enrollment.id!);

                // Release availabilities in user-service
                if (availabilityIds.length > 0) {
                    await this.httpService.releaseAvailabilities(availabilityIds);
                }
            } catch (error) {
                logger.error({ err: error, enrollmentId: enrollment.id }, "Failed to release resources for one-on-one enrollment");
            }
        }

        // For 'course' type, capacity is dynamically calculated by filtering active enrollments in validateCourseEnrollment.
    }
}
