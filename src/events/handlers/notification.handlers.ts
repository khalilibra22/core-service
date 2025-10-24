import { subscribe } from "../event-bus";
import { NotificationService } from "../../services/notification.service";
import { EventMap } from "../../types/events";
import { logger } from "../../utils/logger";

const notificationService = new NotificationService();

// Subscribe to domain events and send notifications
subscribe<EventMap>({
  "enrollment.created": async (payload) => {
    try {
      logger.info({ payload }, "Processing enrollment.created event");
      // Event is logged; client will subscribe via /v1/notifications/subscribe-topic
      // No action needed here unless we want to send a welcome notification
    } catch (err) {
      logger.error({ err, payload }, "Failed to process enrollment.created");
    }
  },

  "session.started": async (payload) => {
    try {
      logger.info({ payload }, "Processing session.started event");
      
      const { courseId, title, sessionId } = payload;
      const topic = `course-${courseId}`;

      await notificationService.sendToTopic({
        topic,
        title: title || "Session Started",
        body: "Join now! The session has begun.",
        data: {
          courseId,
          sessionId,
          type: "session_started",
        },
      });

      logger.info({ topic, sessionId }, "Session started notification sent");
    } catch (err) {
      logger.error({ err, payload }, "Failed to send session.started notification");
    }
  },
});

logger.info("Notification event handlers registered");

