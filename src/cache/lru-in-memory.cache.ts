// src/cache/LruCacheService.ts
import { LRUCache } from "lru-cache";
import { ExternalService } from "../services/external.service";
import { UserType } from "../types/user.types";
import { UserTopicType } from "../types/user.types";

export class LruInMemoryCache {
  private static externalService = new ExternalService();
  private static cache = new LRUCache<string, any>({
    max: parseInt(process.env.CACHE_MAX_SIZE || "10000"), // max 10000 items
    ttl: parseInt(process.env.CACHE_TTL || "300000"), // 5 minutes
  });
  private static inflight = new Map<string, Promise<UserType>>();

  static async getUserDetails(userId: string): Promise<UserType> {
    const key = `user-${userId}`;

    // Check memory cache
    if (this.cache.has(key)) {
      console.log("Cache hit for user:", userId);
      return this.cache.get(key)!;
    }

    // Reuse in-flight request
    if (this.inflight.has(key)) {
      console.log("Waiting for inflight fetch for user:", userId);
      return this.inflight.get(key)!;
    }

    console.log("Cache miss for user:", userId);

    // Create the in-flight promise (do NOT await here)
    const promise: Promise<UserType> = this.externalService
      .getUserDetails(userId)
      .then((user: UserType) => {
        this.cache.set(key, user);
        this.inflight.delete(key);
        return user;
      })
      .catch((err) => {
        this.inflight.delete(key);
        throw err;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  static async getUserTopic(userTopicId: number): Promise<UserTopicType> {
    if (this.cache.has(`topic-${userTopicId}`)) {
      return this.cache.get(`topic-${userTopicId}`);
    }
    const topic = await this.externalService.getUserTopic(userTopicId);
    this.cache.set(`topic-${userTopicId}`, topic);
    return topic;
  }
}
