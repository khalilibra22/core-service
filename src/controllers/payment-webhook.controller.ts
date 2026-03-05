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
            const { transactionId, externalId, referenceId, referenceType, status, provider, method } = req.body;

            logger.info({ body: req.body }, "Received payment webhook - RAW BODY");
            logger.info({ transactionId, referenceId, status, provider, method }, "Received payment webhook");

            if (referenceType === "COURSE_ENROLLMENT" || referenceType === "ONE_ON_ONE_ENROLLMENT") {
                await this.orchestrator.handlePaymentWebhook({
                    transactionId,
                    externalId,
                    referenceId,
                    referenceType,
                    status,
                    provider,
                    method
                });
            }

            res.status(200).json({ received: true });
        } catch (error) {
            logger.error({ err: error }, "Error handling payment webhook");
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
