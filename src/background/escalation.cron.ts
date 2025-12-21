import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { ComplaintModel } from "../models/complaint.model";
import { logger } from "../utils/logger";

/**
 * Daily job to check for complaints that have passed their 72h deadline
 * and escalate them automatically if they haven't been responded to.
 */
export const startEscalationCron = () => {
    // Run every day at 00:00
    cron.schedule("0 0 * * *", async () => {
        logger.info("Running complaint escalation cron job...");
        try {
            const complaintRepo = AppDataSource.getRepository(ComplaintModel);

            const now = new Date();

            // Find complaints that are:
            // 1. status = 'pending' (in_progress)
            // 2. now > deadline
            const complaintsToEscalate = await complaintRepo
                .createQueryBuilder("complaint")
                .where("complaint.status = :status", { status: "pending" })
                .andWhere("complaint.deadline IS NOT NULL")
                .andWhere("complaint.deadline <= :now", { now })
                .getMany();

            if (complaintsToEscalate.length === 0) {
                logger.info("No complaints found for auto-escalation.");
                return;
            }

            logger.info(`Found ${complaintsToEscalate.length} complaints to escalate.`);

            for (const complaint of complaintsToEscalate) {
                complaint.status = "escalated";
                complaint.adminResponse = "Automatically escalated after 72 hours of inactivity from tutor.";
                await complaintRepo.save(complaint);
                logger.info(`Escalated complaint ID: ${complaint.id}`);
            }

            logger.info("Complaint escalation cron job completed successfully.");
        } catch (error) {
            logger.error({ err: error }, "Error in complaint escalation cron job");
        }
    });
};
