import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { EnrollmentOrchestratorService } from "../services/enrollment-orchestrator.service";
import { logger } from "../utils/logger";

@injectable()
export class PaymentWebhookController {
    constructor(
        @inject(EnrollmentOrchestratorService) private orchestrator: EnrollmentOrchestratorService
    ) { }

    handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId, referenceId, referenceType, status } = req.body;

            logger.info({ transactionId, referenceId, status }, "Received payment webhook");

            if (referenceType === "COURSE_ENROLLMENT" || referenceType === "ONE_ON_ONE_ENROLLMENT") {
                await this.orchestrator.handlePaymentWebhook({
                    transactionId,
                    referenceId,
                    referenceType,
                    status
                });
            }

            res.status(200).json({ received: true });
        } catch (error) {
            logger.error({ err: error }, "Error handling payment webhook");
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
