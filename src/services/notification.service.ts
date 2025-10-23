import { getFcm } from "../config/firebase-admin";

type KeyValue = Record<string, string>;

export type PlatformOverrides = {
  android?: Record<string, any>;
  apns?: Record<string, any>;
  webpush?: Record<string, any>;
};

export type SendToTokensInput = PlatformOverrides & {
  title: string;
  body: string;
  data?: KeyValue;
  imageUrl?: string;
  tokens: string[];
};

export type SendToTopicInput = PlatformOverrides & {
  title: string;
  body: string;
  data?: KeyValue;
  imageUrl?: string;
  topic: string;
};

export class NotificationService {
  private static readonly MAX_BATCH = 500;

  private buildCommonPayload(
    title: string,
    body: string,
    data?: KeyValue,
    imageUrl?: string
  ) {
    return {
      notification: { title, body, imageUrl },
      data: this.normalizeData(data),
    } as const;
  }

  private normalizeData(data?: KeyValue): KeyValue | undefined {
    if (!data) return undefined;
    const normalized: KeyValue = {};
    for (const [k, v] of Object.entries(data)) {
      normalized[String(k)] = String(v);
    }
    return normalized;
  }

  private chunk<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  async sendToTokens(input: SendToTokensInput) {
    const fcm = getFcm();
    if (!fcm) {
      throw new Error("FCM not configured");
    }

    const { title, body, data, imageUrl, tokens, android, apns, webpush } = input;
    const payloadBase = this.buildCommonPayload(title, body, data, imageUrl);

    const batches = this.chunk(tokens, NotificationService.MAX_BATCH);
    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ index: number; error: any }> = [];

    for (const batch of batches) {
      const response = await fcm.sendEachForMulticast(
        {
          ...payloadBase,
          tokens: batch,
          android,
          apns,
          webpush,
        },
        Boolean(process.env.FCM_DRY_RUN)
      );

      successCount += response.successCount;
      failureCount += response.failureCount;
      response.responses.forEach((r, idx) => {
        if (!r.success) errors.push({ index: idx, error: r.error });
      });
    }

    return { successCount, failureCount, errors };
  }

  async sendToTopic(input: SendToTopicInput) {
    const fcm = getFcm();
    if (!fcm) {
      throw new Error("FCM not configured");
    }

    const { title, body, data, imageUrl, topic, android, apns, webpush } = input;
    const payloadBase = this.buildCommonPayload(title, body, data, imageUrl);

    const message = {
      ...payloadBase,
      topic,
      android,
      apns,
      webpush,
    } as any;

    const messageId = await fcm.send(message, Boolean(process.env.FCM_DRY_RUN));
    return { messageId };
  }

  async subscribeTokenToTopic(token: string, topic: string) {
    const fcm = getFcm();
    if (!fcm) {
      throw new Error("FCM not configured");
    }

    const res = await fcm.subscribeToTopic([token], topic);
    return res;
  }

  async unsubscribeTokenFromTopic(token: string, topic: string) {
    const fcm = getFcm();
    if (!fcm) {
      throw new Error("FCM not configured");
    }

    const res = await fcm.unsubscribeFromTopic([token], topic);
    return res;
  }
}


