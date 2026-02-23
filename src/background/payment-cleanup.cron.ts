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
            const manualInitiationLimit = new Date(now);
            manualInitiationLimit.setHours(manualInitiationLimit.getHours() - 24); // 24 hours to initiate manual

            const baselineLimit = new Date(now);
            baselineLimit.setHours(baselineLimit.getHours() - 1); // 1 hour for others (Satim/Wallet/Default)

            const manualLimit = new Date(now);
            manualLimit.setHours(manualLimit.getHours() - 72); // 3 days for Manual (initiated)

            let expiredCount = 0;

            for (const enrollment of pendingEnrollments) {
                if (!enrollment.id) continue;

                // Check transaction status from user-service
                const type = enrollment.type === "one-on-one" ? "ONE_ON_ONE_ENROLLMENT" : "COURSE_ENROLLMENT";
                const transaction = await httpService.getTransactionStatus(type, enrollment.id);

                // --- NEW SUCCESS PROTECTION ---
                if (transaction && transaction.status === "success") {
                    logger.info({ enrollmentId: enrollment.id }, "Syncing missed successful payment discovered by cron");
                    try {
                        const { container } = require("tsyringe");
                        const { EnrollmentOrchestratorService } = require("../services/enrollment-orchestrator.service");
                        const orchestrator = container.resolve(EnrollmentOrchestratorService);
                        await orchestrator.handlePaymentWebhook({
                            transactionId: transaction.id,
                            externalId: transaction.externalId,
                            referenceId: enrollment.id,
                            referenceType: type,
                            status: "success",
                            provider: transaction.provider,
                            method: transaction.method
                        });
                        continue; // Successfully synced, move to next
                    } catch (err) {
                        logger.error({ err, enrollmentId: enrollment.id }, "Failed to sync missed successful payment");
                    }
                }

                const statusRequiringTimeout = ["pending", "failed", "canceled"];

                let shouldExpire = false;

                if (!transaction) {
                    // No transaction found? (Student hasn't clicked "Pay" or "Initiate" yet)
                    // We allow 24 hours to initiate for EVERYTHING (Safer than checking paymentMethod which might be null/default)
                    if (enrollment.createdAt && new Date(enrollment.createdAt).getTime() < manualInitiationLimit.getTime()) {
                        shouldExpire = true;
                    }
                } else if (transaction.provider === "satim") {
                    // Automated payment: 1 hour (extended from 30 mins)
                    if (statusRequiringTimeout.includes(transaction.status) && enrollment.createdAt && new Date(enrollment.createdAt).getTime() < baselineLimit.getTime()) {
                        shouldExpire = true;
                    }
                } else {
                    // Manual payment (Baridimob/Transfer)
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin. DO NOT EXPIRE.
                        continue;
                    }

                    // No receipt uploaded yet (Status: pending): 3 days (keeps existing 72h window)
                    if (statusRequiringTimeout.includes(transaction.status) && enrollment.createdAt && new Date(enrollment.createdAt).getTime() < manualLimit.getTime()) {
                        shouldExpire = true;
                    }
                }

                if (shouldExpire) {
                    enrollment.status = "expired";
                    await enrollmentRepo.save(enrollment);
                    logger.info({
                        enrollmentId: enrollment.id,
                        createdAt: enrollment.createdAt,
                        limit: (transaction?.provider === "satim" || !transaction) ? baselineLimit : manualLimit,
                        transactionStatus: transaction?.status || "none"
                    }, "Marked enrollment as expired due to timeout");

                    if (enrollment.id) await releaseResources(enrollment);
                    expiredCount++;
                } else {
                    // Log skipped enrollments for debugging if they are close to expiring
                    logger.debug({ enrollmentId: enrollment.id, createdAt: enrollment.createdAt, status: enrollment.status }, "Enrollment within grace period, skipping expiration");
                }
            }
        } catch (error) {
            logger.error({ err: error }, "Error in payment cleanup cron job");
        }
    });
};

const releaseResources = async (enrollment: EnrollmentModel) => {
    try {
        const { container } = require("tsyringe");
        const { EnrollmentOrchestratorService } = require("../services/enrollment-orchestrator.service");
        const orchestrator = container.resolve(EnrollmentOrchestratorService);
        await (orchestrator as any).releaseEnrollmentResources(enrollment);
    } catch (err) {
        logger.error({ err, enrollmentId: enrollment.id }, "Failed to release resources for expired enrollment");
    }
};
