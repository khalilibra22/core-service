import { Request, Response } from "express";
import { injectable, inject } from "tsyringe";
import { EnrollmentService } from "../services/enrollment.service";
import { logger } from "../utils/logger";

@injectable()
export class PaymentWebhookController {
    constructor(
        @inject(EnrollmentService) private enrollmentService: EnrollmentService
    ) { }

    handlePaymentWebhook = async (req: Request, res: Response): Promise<void> => {
        try {
            const { transactionId, referenceId, referenceType, status, method } = req.body;

            logger.info({ transactionId, referenceId, status }, "Received payment webhook");

            if (status === "success") {
                if (referenceType === "COURSE_ENROLLMENT" || referenceType === "ONE_ON_ONE_ENROLLMENT") {
                    await this.enrollmentService.updateEnrollmentPaymentStatus(referenceId, "paid", transactionId, method);
                }
            }

            res.status(200).json({ received: true });
        } catch (error) {
            logger.error({ err: error }, "Error handling payment webhook");
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
}
