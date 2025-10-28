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
      
      const { courseId, enrollmentId, courseTitle, fcmToken } = payload;
      
      // 1. Send personal notification to the enrolling student (if token provided)
      if (fcmToken) {
        try {
          await notificationService.sendToTokens({
            tokens: [fcmToken],
            title: "Enrollment Confirmed",
            body: `You enrolled in ${courseTitle || "the course"}.`,
            data: {
              type: "course_enrollment_created",
              courseId,
              enrollmentId,
            },
          });
          logger.info({ enrollmentId, courseId }, "Personal enrollment notification sent to student");
        } catch (err) {
          logger.error({ err, enrollmentId }, "Failed to send personal enrollment notification");
        }
      }
      
      // 2. Send notification to teacher via teacher-courseId topic
      const teacherTopic = `teacher-${courseId}`;
      try {
        await notificationService.sendToTopic({
          topic: teacherTopic,
          title: "New Enrollment",
          body: `A student enrolled in ${courseTitle || "your course"}.`,
          data: {
            type: "teacher_enrollment_notification",
            courseId,
            enrollmentId,
          },
        });
        logger.info({ teacherTopic, enrollmentId, courseId }, "Teacher enrollment notification sent");
      } catch (err) {
        logger.error({ err, teacherTopic, enrollmentId }, "Failed to send teacher enrollment notification");
      }
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

