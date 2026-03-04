import { EnrollmentService } from "./enrollment.service";
import { HttpService } from "./http.service";
import { NotificationService } from "./notification.service";
import { CourseService } from "./course.service";
import { SessionService } from "./session.service";
import { CourseModel } from "../models/course.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { LruInMemoryCache } from "../cache/lru-in-memory.cache";
import { logger } from "../utils/logger";
import { publish } from "../events";
import * as fs from "fs";
import * as path from "path";
import { injectable, inject } from "tsyringe";

interface EnrollmentResult {
    enrollment: EnrollmentModel;
    topic: string;
    paymentData?: {
        amount: number;
        description: string;
        referenceId: string;
        referenceType: "COURSE_ENROLLMENT" | "ONE_ON_ONE_ENROLLMENT";
        metadata?: any;
    };
    paymentUrl?: string;
    transactionId?: string;
    paymentMessage?: string;
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
            paymentMethod: method,
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


        // Prepare Payment Data
        const paymentData = {
            amount: course.price || 0,
            method,
            referenceType: "COURSE_ENROLLMENT" as const,
            referenceId: enrollment.id!,
            description: `Enrollment in course '${course.name}'`,
            metadata: { teacherId: course.ownerId, courseType: course.type }
        };

        if (fcmToken) {
            try {
                await this.notificationService.subscribeTokenToTopic(fcmToken, topic);
                logger.info({ topic, enrollmentId: enrollment.id }, "Auto-subscribed to course topic");
            } catch (err) {
                logger.warn({ err, topic }, "Failed to auto-subscribe to course topic");
            }
        }

        if (method === "wallet") {
            try {
                const initResult = await this.initiatePaymentFlow(
                    studentId,
                    paymentData.amount,
                    "COURSE_ENROLLMENT",
                    enrollment.id!,
                    paymentData.description,
                    "wallet",
                    paymentData.metadata
                );
                if (initResult) {
                    return {
                        enrollment,
                        topic,
                        paymentData,
                        transactionId: initResult.transactionId,
                        paymentMessage: "Payment processed via wallet"
                    };
                }
            } catch (err) {
                logger.error({ err, enrollmentId: enrollment.id }, "Auto-initiating wallet payment failed");
            }
        }

        return { enrollment, topic, paymentData };
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
        const pricePerHour = Number(userTopic?.price || 0);

        // Price is per hour. Sum the duration of all paid sessions (duration is stored in minutes)
        // and convert to hours to get the correct billable amount.
        const totalPaidMinutes = sessions
            .filter(s => s.isPaid !== false) // exclude free sessions
            .reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
        const totalHours = totalPaidMinutes / 60;
        const amount = Math.round(pricePerHour * totalHours * 100) / 100; // round to 2 decimal places

        logger.info(
            { topicId, pricePerHour, totalPaidMinutes, totalHours, amount },
            "Calculated one-on-one enrollment amount"
        );

        const enrollmentBody = {
            studentId,
            teacherId,
            sessions,
            type: "one-on-one",
            groupId,
            status: "pending_payment",
            paymentMethod: method,
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


        // Prepare Payment Data
        const paymentData = {
            amount,
            method,
            referenceType: "ONE_ON_ONE_ENROLLMENT" as const,
            referenceId: enrollment.id!,
            description: `1-on-1 sessions for topic '${userTopic?.topic?.name || topicId}'`,
            metadata: { teacherId, courseType: "one_on_one" }
        };

        if (method === "wallet") {
            try {
                const initResult = await this.initiatePaymentFlow(
                    studentId,
                    amount,
                    "ONE_ON_ONE_ENROLLMENT",
                    enrollment.id!,
                    paymentData.description,
                    "wallet",
                    paymentData.metadata
                );
                if (initResult) {
                    return {
                        enrollment,
                        topic,
                        paymentData,
                        transactionId: initResult.transactionId,
                        paymentMessage: "Payment processed via wallet"
                    };
                }
            } catch (err) {
                logger.error({ err, enrollmentId: enrollment.id }, "Auto-initiating wallet payment failed");
            }
        }

        return { enrollment, topic, paymentData };
    }

    private async initiatePaymentFlow(
        userId: string,
        amount: number,
        referenceType: string,
        referenceId: string,
        description: string,
        method: string = "satim",
        metadata?: any
    ): Promise<{ paymentUrl?: string; transactionId: string } | null> {
        if (!amount || amount <= 0) {
            return null;
        }

        const paymentResponse = await this.httpService.initiatePayment({
            userId,
            amount,
            method,
            referenceType,
            referenceId,
            description,
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
        externalId?: string;
        referenceId: string;
        referenceType: string;
        status: "success" | "failed";
        provider?: string;
        method?: string;
    }): Promise<void> {
        const debugPath = path.join(process.cwd(), "webhook-debug.log");
        const { referenceId, status, transactionId, externalId, provider, method } = payload;

        fs.appendFileSync(debugPath, `[${new Date().toISOString()}] Received webhook: ${JSON.stringify(payload)}\n`);

        logger.info({ referenceId, status, transactionId }, "Handling payment webhook");

        const enrollment = await this.enrollmentService.getEnrollmentById(referenceId);
        if (!enrollment) {
            logger.error({ referenceId }, "Enrollment not found for webhook");
            throw new Error(`Enrollment not found: ${referenceId}`);
        }

        logger.info({ enrollmentId: enrollment.id, currentStatus: enrollment.status }, "Found enrollment for webhook");

        if (status === "success") {
            enrollment.status = "approved";
            enrollment.paymentStatus = "paid";
            enrollment.paymentId = externalId || transactionId;
            enrollment.paymentProvider = method || provider;
            logger.info({ paymentId: enrollment.paymentId, provider: enrollment.paymentProvider }, "Setting enrollment to PAID/APPROVED");
        } else {
            // enrollment.status = "rejected"; // Don't reject immediately, allow the student to retry within the timeout window
            enrollment.paymentStatus = "failed";
            logger.info({ enrollmentId: enrollment.id, status }, "Payment failed or was canceled. Keeping enrollment active (pending_payment) for potential retry until timeout.");
            // We don't call releaseEnrollmentResources here anymore; the cleanup cron will do it when the time expires.
        }

        const updated = await this.enrollmentService.updateEnrollment(enrollment);
        logger.info({ enrollmentId: updated.id, status: updated.status, paymentId: updated.paymentId, paymentStatus: updated.paymentStatus }, "Enrollment successfully updated and saved in DB");
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
