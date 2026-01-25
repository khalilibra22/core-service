import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { logger } from "../utils/logger";
import { inject, injectable } from "tsyringe";

@injectable()
export class NotificationController {
  constructor(
    @inject(NotificationService) private service: NotificationService
  ) { }

  sendToTokens = async (req: Request, res: Response) => {
    try {
      const result = await this.service.sendToTokens(req.body);
      if (result.failureCount > 0) {
        logger.warn({ result }, "FCM sendToTokens partial failures");
      }
      res.status(200).json(result);
    } catch (err: any) {
      logger.error({ err }, "FCM sendToTokens error");
      res.status(500).json({ error: "Failed to send notifications" });
    }
  };

  sendToTopic = async (req: Request, res: Response) => {
    try {
      const result = await this.service.sendToTopic(req.body);
      res.status(200).json(result);
    } catch (err: any) {
      logger.error({ err }, "FCM sendToTopic error");
      res.status(500).json({ error: "Failed to send topic notification" });
    }
  };

  subscribeTopic = async (req: Request, res: Response) => {
    try {
      const { token, topic } = req.body as { token: string; topic: string };
      const result = await this.service.subscribeTokenToTopic(token, topic);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error({ err }, "FCM subscribeTopic error");
      res.status(500).json({ error: "Failed to subscribe to topic" });
    }
  };

  unsubscribeTopic = async (req: Request, res: Response) => {
    try {
      const { token, topic } = req.body as { token: string; topic: string };
      const result = await this.service.unsubscribeTokenFromTopic(token, topic);
      res.status(200).json({ success: true, ...result });
    } catch (err: any) {
      logger.error({ err }, "FCM unsubscribeTopic error");
      res.status(500).json({ error: "Failed to unsubscribe from topic" });
    }
  };
}


