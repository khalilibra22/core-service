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
      
      const { courseId, enrollmentId, title, sessionId } = payload;
      
      // Determine topic based on session type
      let topic: string;
      let notificationType: string;
      let notificationData: Record<string, string>;
      
      if (enrollmentId) {
        // One-on-one session
        topic = `oneonone-${enrollmentId}`;
        notificationType = "oneonone_session_started";
        notificationData = {
          enrollmentId,
          sessionId,
          type: notificationType,
        };
      } else if (courseId) {
        // Course session (group/live)
        topic = `course-${courseId}`;
        notificationType = "session_started";
        notificationData = {
          courseId,
          sessionId,
          type: notificationType,
        };
      } else {
        logger.warn({ payload }, "session.started event missing both courseId and enrollmentId");
        return;
      }

      await notificationService.sendToTopic({
        topic,
        title: title || "Session Started",
        body: "Join now! The session has begun.",
        data: notificationData,
      });

      logger.info({ topic, sessionId, type: notificationType }, "Session started notification sent");
    } catch (err) {
      logger.error({ err, payload }, "Failed to send session.started notification");
    }
  },
});

logger.info("Notification event handlers registered");

