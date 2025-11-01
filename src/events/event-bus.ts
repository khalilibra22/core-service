import Redis from "ioredis";
import { logger } from "../utils/logger";
import { EventMap } from "../types/events";

type RedisClient = Redis;

function createRedisClient(kind: "publisher" | "subscriber"): RedisClient | null {
  const eventsEnabled = (process.env.EVENTS_ENABLED ?? "true").toLowerCase() !== "false";
  if (!eventsEnabled) {
    if (kind === "publisher") {
      logger.warn("Events disabled by EVENTS_ENABLED=false");
    }
    return null;
  }

  const url = process.env.REDIS_URL;
  try {
    if (url) {
      const client = new Redis(url);
      wireLogs(client, kind);
      return client;
    }

    const host = process.env.REDIS_HOST || "127.0.0.1";
    const port = Number(process.env.REDIS_PORT || 6379);
    const password = process.env.REDIS_PASSWORD;             // optional

    if (!host) {
      if (kind === "publisher") {
        logger.warn("Events not configured: missing REDIS_URL or REDIS_HOST");
      }
      return null;
    }

    const client = new Redis({
      host,
      port,
      password,
      lazyConnect: false,
    });
    wireLogs(client, kind);
    return client;
  } catch (err) {
    logger.error({ err, kind }, "Failed to create Redis client");
    return null;
  }
}

function wireLogs(client: RedisClient, kind: string) {
  client.on("connect", () => logger.info({ kind }, "Redis connect"));
  client.on("ready", () => logger.info({ kind }, "Redis ready"));
  client.on("error", (err) => logger.error({ err, kind }, "Redis error"));
  client.on("end", () => logger.warn({ kind }, "Redis connection ended"));
  client.on("reconnecting", () => logger.warn({ kind }, "Redis reconnecting"));
}

let pub: RedisClient | null = null;
let sub: RedisClient | null = null;

function getPublisher(): RedisClient | null {
  if (pub) return pub;
  pub = createRedisClient("publisher");
  return pub;
}

function getSubscriber(): RedisClient | null {
  if (sub) return sub;

  const isConsumer = (process.env.EVENTS_SUBSCRIBER ?? "true").toLowerCase() === "true";
  if (!isConsumer) {
    logger.warn("Event subscription skipped: not a consumer (EVENTS_SUBSCRIBER=false)");
    return null;
  }

  sub = createRedisClient("subscriber");
  return sub;
}

export type HandlerMap<T> = {
  [K in keyof T]?: (payload: T[K]) => Promise<void>;
};

export async function publish<K extends keyof EventMap>(
  channel: K,
  payload: EventMap[K]
): Promise<void> {
  const publisher = getPublisher();
  if (!publisher) {
    logger.debug({ channel }, "Event publishing skipped: Redis not configured");
    return;
  }

  try {
    await publisher.publish(String(channel), JSON.stringify(payload));
    logger.debug({ channel, payload }, "Event published");
  } catch (err) {
    logger.error({ err, channel, payload }, "Failed to publish event");
  }
}

export function subscribe<T extends EventMap>(handlers: HandlerMap<T>): void {
  const subscriber = getSubscriber();
  if (!subscriber) {
    logger.warn("Event subscription skipped: Redis not configured");
    return;
  }

  const channels = Object.keys(handlers);
  if (channels.length === 0) {
    logger.warn("No event handlers provided for subscription");
    return;
  }

  subscriber.subscribe(...channels, (err, count) => {
    if (err) {
      logger.error({ err }, "Failed to subscribe to events");
      return;
    }
    logger.info({ count, channels }, "Subscribed to event channels");
  });

  subscriber.on("message", async (ch, msg) => {
    try {
      const payload = JSON.parse(msg);
      const handler = handlers[ch as keyof T];
      if (handler) {
        await handler(payload as any);
        logger.debug({ channel: ch }, "Event handled successfully");
      }
    } catch (err) {
      logger.error({ err, channel: ch }, "Event handler error");
    }
  });
}

