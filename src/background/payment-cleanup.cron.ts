import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { EnrollmentModel } from "../models/enrollment.model";
import { logger } from "../utils/logger";
import { LessThan } from "typeorm";

/**
 * Job to check for enrollments that are pending payment for too long
 * and mark them as expired.
 *
 * Timeout rules (all measured from TRANSACTION creation, not enrollment creation):
 *  - No transaction yet          → 24 h from enrollment.createdAt (user never clicked Pay)
 *  - SATIM (bank redirect)       → 30 min from transaction.createdAt
 *  - Wallet (instant debit)      → 30 min from transaction.createdAt
 *  - Manual, no receipt yet      → 72 h from transaction.createdAt
 *  - Manual, pending_verification → NEVER expire (admin must review)
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

            // ── Timeout windows ────────────────────────────────────────────────────
            // No-transaction (user never clicked Pay): 24 hours from enrollment creation
            const noTransactionLimit = new Date(now);
            noTransactionLimit.setHours(noTransactionLimit.getHours() - 24);

            // SATIM / Wallet (automated, redirect-based): 30 minutes from transaction creation.
            // Measured from transaction.createdAt (when the user clicked Pay),
            // NOT from enrollment.createdAt — so the full window is always available
            // regardless of how long the user waited before initiating payment.
            const automatedLimit = new Date(now);
            automatedLimit.setMinutes(automatedLimit.getMinutes() - 30);

            // Manual – no receipt uploaded yet (pending): 3 days from transaction creation
            const manualPendingLimit = new Date(now);
            manualPendingLimit.setHours(manualPendingLimit.getHours() - 72);
            // ──────────────────────────────────────────────────────────────────────

            let expiredCount = 0;

            for (const enrollment of pendingEnrollments) {
                if (!enrollment.id) continue;

                // Fetch transaction status from user-service
                const type = enrollment.type === "one-on-one" ? "ONE_ON_ONE_ENROLLMENT" : "COURSE_ENROLLMENT";
                const transaction = await httpService.getTransactionStatus(type, enrollment.id);

                // --- SUCCESS PROTECTION: sync any missed successful payment ---
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

                const expirableStatuses = ["pending", "failed", "canceled"];

                let shouldExpire = false;
                let expiryReason = "";

                if (!transaction) {
                    // No transaction at all — user never clicked Pay.
                    // Give 24 hours from enrollment creation to start any payment.
                    if (
                        enrollment.createdAt &&
                        new Date(enrollment.createdAt).getTime() < noTransactionLimit.getTime()
                    ) {
                        shouldExpire = true;
                        expiryReason = "no_transaction_24h";
                    }
                } else if (transaction.provider === "satim" || transaction.method === "wallet") {
                    // ── Automated payments: SATIM (bank redirect) & Wallet (instant debit) ──
                    // Use transaction.createdAt so users get the full 30-min window
                    // from the moment they actually initiated payment.
                    const txCreatedAt = transaction.createdAt
                        ? new Date(transaction.createdAt)
                        : new Date(enrollment.createdAt ?? new Date(0)); // safe fallback

                    if (
                        expirableStatuses.includes(transaction.status) &&
                        txCreatedAt.getTime() < automatedLimit.getTime()
                    ) {
                        shouldExpire = true;
                        expiryReason = `automated_timeout_30min (provider:${transaction.provider}, method:${transaction.method})`;
                    }
                } else {
                    // ── Manual payments: Baridimob / CCP Transfer ──
                    if (transaction.status === "pending_verification") {
                        // Receipt uploaded, waiting for admin review — NEVER expire.
                        logger.debug(
                            { enrollmentId: enrollment.id },
                            "Manual payment pending admin verification, skipping expiration"
                        );
                        continue;
                    }

                    // No receipt uploaded yet (pending / failed / canceled):
                    // Give 3 days from transaction creation.
                    const txCreatedAt = transaction.createdAt
                        ? new Date(transaction.createdAt)
                        : new Date(enrollment.createdAt ?? new Date(0));

                    if (
                        expirableStatuses.includes(transaction.status) &&
                        txCreatedAt.getTime() < manualPendingLimit.getTime()
                    ) {
                        shouldExpire = true;
                        expiryReason = `manual_no_receipt_72h (method:${transaction.method})`;
                    }
                }

                if (shouldExpire) {
                    enrollment.status = "expired";
                    await enrollmentRepo.save(enrollment);
                    logger.info(
                        {
                            enrollmentId: enrollment.id,
                            enrollmentCreatedAt: enrollment.createdAt,
                            transactionCreatedAt: transaction?.createdAt ?? null,
                            transactionStatus: transaction?.status ?? "none",
                            provider: transaction?.provider ?? "none",
                            method: transaction?.method ?? "none",
                            expiryReason
                        },
                        "Marked enrollment as expired due to timeout"
                    );

                    if (enrollment.id) await releaseResources(enrollment);
                    expiredCount++;
                } else {
                    logger.debug(
                        {
                            enrollmentId: enrollment.id,
                            enrollmentCreatedAt: enrollment.createdAt,
                            transactionStatus: transaction?.status ?? "none"
                        },
                        "Enrollment within grace period, skipping expiration"
                    );
                }
            }

            logger.info({ expiredCount }, "Payment cleanup cron job finished");
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
