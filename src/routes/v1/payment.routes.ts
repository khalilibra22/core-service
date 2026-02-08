import express from "express";
import { container } from "../../container";
import { PaymentWebhookController } from "../../controllers/payment-webhook.controller";

const router = express.Router();

const paymentWebhookController = container.resolve(PaymentWebhookController);

router.post(
    "/webhook",
    (req, res) => paymentWebhookController.handlePaymentWebhook(req, res)
);

export { router as paymentRouter };
