import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { LessThan } from "typeorm";

/**
 * Job to check for enrollments that are pending payment for too long
 * and mark them as expired.
 */
export const startPaymentCleanupCron = () => {
    // Run every 10 minutes
    cron.schedule("*/10 * * * *", async () => {
        logger.info("Running payment cleanup cron job...");
        try {
            const enrollmentRepo = AppDataSource.getRepository(EnrollmentModel);
            const { HttpService } = require("../services/http.service");
            const httpService = new HttpService();

            const pendingEnrollments = await enrollmentRepo.find({
                where: {
                    status: "pending_payment"
                }
            });

            if (pendingEnrollments.length === 0) {
                logger.info("No pending enrollments found.");
                return;
            }

            const now = new Date();
            const satimLimit = new Date(now);
            satimLimit.setMinutes(satimLimit.getMinutes() - 30); // 30 mins for SATIM/Direct

            const manualLimit = new Date(now);
            manualLimit.setHours(manualLimit.getHours() - 72); // 3 days for Manual

            let expiredCount = 0;

            for (const enrollment of pendingEnrollments) {
                if (!enrollment.id) continue;

                // Check transaction status from user-service
                const type = enrollment.type === "one-on-one" ? "ONE_ON_ONE_ENROLLMENT" : "COURSE_ENROLLMENT";
                const transaction = await httpService.getTransactionStatus(type, enrollment.id);

                let shouldExpire = false;

                if (!transaction) {
                    // No transaction found? Fallback to 30 mins
                    if (enrollment.createdAt && enrollment.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else if (transaction.provider === "satim") {
                    // Automated payment: 30 minutes
                    if (enrollment.createdAt && enrollment.createdAt < satimLimit) {
                        shouldExpire = true;
                    }
                } else {
                    // Manual payment
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin. DO NOT EXPIRE.
                        continue;
                    }

                    // No receipt uploaded yet: 3 days
                    if (enrollment.createdAt && enrollment.createdAt < manualLimit) {
                        shouldExpire = true;
                    }
                }

                if (shouldExpire) {
                    enrollment.status = "expired";
                    await enrollmentRepo.save(enrollment);
                    logger.info({ enrollmentId: enrollment.id }, "Marked enrollment as expired due to layout timeout");

                    try {
                        const { container } = require("tsyringe");
                        const { EnrollmentOrchestratorService } = require("../services/enrollment-orchestrator.service");
                        const orchestrator = container.resolve(EnrollmentOrchestratorService);
                        await (orchestrator as any).releaseEnrollmentResources(enrollment);
                    } catch (err) {
                        logger.error({ err, enrollmentId: enrollment.id }, "Failed to release resources for expired enrollment");
                    }

                    expiredCount++;
                }
            }

            logger.info(`Payment cleanup cron job completed. Expired ${expiredCount} enrollments.`);
        } catch (error) {
            logger.error({ err: error }, "Error in payment cleanup cron job");
        }
    });
};
