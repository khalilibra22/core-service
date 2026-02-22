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

                // If transaction failed or canceled, expire it immediately
                if (transaction && (transaction.status === "failed" || transaction.status === "canceled")) {
                    logger.info({ enrollmentId: enrollment.id, status: transaction.status }, "Expiring enrollment due to failed/canceled transaction");
                    enrollment.status = "expired";
                    await enrollmentRepo.save(enrollment);
                    if (enrollment.id) await releaseResources(enrollment);
                    expiredCount++;
                    continue;
                }

                let shouldExpire = false;

                if (!transaction) {
                    // No transaction found? (Student hasn't clicked "Pay" or "Initiate" yet)
                    const isManual = enrollment.paymentMethod === "baridimob" || enrollment.paymentMethod === "transfer";
                    const limit = isManual ? manualInitiationLimit : baselineLimit;

                    if (enrollment.createdAt && enrollment.createdAt < limit) {
                        shouldExpire = true;
                    }
                } else if (transaction.provider === "satim") {
                    // Automated payment: 1 hour (extended from 30 mins)
                    if (transaction.status === "pending" && enrollment.createdAt && enrollment.createdAt < baselineLimit) {
                        shouldExpire = true;
                    }
                } else {
                    // Manual payment (Baridimob/Transfer)
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin. DO NOT EXPIRE.
                        continue;
                    }

                    // No receipt uploaded yet (Status: pending): 3 days (keeps existing 72h window)
                    if (transaction.status === "pending" && enrollment.createdAt && enrollment.createdAt < manualLimit) {
                        shouldExpire = true;
                    }
                }

                if (shouldExpire) {
                    enrollment.status = "expired";
                    await enrollmentRepo.save(enrollment);
                    logger.info({ enrollmentId: enrollment.id }, "Marked enrollment as expired due to timeout");

                    if (enrollment.id) await releaseResources(enrollment);
                    expiredCount++;
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
