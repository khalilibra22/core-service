import express from "express";
import { NotificationController } from "../../controllers/notification.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import {
  sendToTokensSchema,
  sendToTopicSchema,
  topicSubscriptionSchema,
} from "../../validations/notification.validation";
import { container } from "tsyringe";

const router = express.Router();
const controller = container.resolve(NotificationController);


// Send to a set of tokens (stateless)
router.post(
  "/send",
  AuthMiddleware.verifyToken,
  // Optionally restrict with: AuthMiddleware.authorize("notifications", "send"),
  ValidationMiddleware.validate(sendToTokensSchema),
  controller.sendToTokens
);

// Send to topic
router.post(
  "/send-topic",
  AuthMiddleware.verifyToken,
  // Optionally restrict with: AuthMiddleware.authorize("notifications", "send"),
  ValidationMiddleware.validate(sendToTopicSchema),
  controller.sendToTopic
);

// Subscribe a token to topic
router.post(
  "/subscribe-topic",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(topicSubscriptionSchema),
  controller.subscribeTopic
);

// Unsubscribe a token from topic
router.post(
  "/unsubscribe-topic",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(topicSubscriptionSchema),
  controller.unsubscribeTopic
);

export { router as notificationRouter };


