// src/cache/LruCacheService.ts
import { LRUCache } from "lru-cache";
import { MinimalUser, UserTopic, Topic, Subject } from "../types/user.types";
import { HttpService } from "../services/http.service";


export class LruInMemoryCache {
  // private static externalService = new GrpcExternalService({
  //   apiKey: process.env.USER_SERVICE_API_KEY || 'default-api-key-for-development'
  // });
  private static externalService = new HttpService();
  private static cache = new LRUCache<string, any>({
    max: parseInt(process.env.CACHE_MAX_SIZE || "10000"), // max 10000 items
    ttl: parseInt(process.env.CACHE_TTL || "300000"), // 5 minutes
  });
  private static inflight = new Map<string, Promise<MinimalUser | null>>();

  private static topicInflight = new Map<string, Promise<UserTopic | null>>();
  private static generalTopicInflight = new Map<string, Promise<Topic | null>>();
  private static subjectInflight = new Map<string, Promise<Subject | null>>();

  static async getUserDetails(userId: string): Promise<MinimalUser | null> {
    try {
      const key = `user-${userId}`;

      // Check memory cache
      if (this.cache.has(key)) {
        console.log("Cache hit for user:", userId);
        return this.cache.get(key)!;
      }

      // Reuse in-flight request
      if (this.inflight.has(key)) {
        console.log("Waiting for inflight fetch for user:", userId);
        const inflightPromise = this.inflight.get(key)!;
        // Add a catch to handle any errors in the inflight promise
        return inflightPromise.catch((err) => {
          //console.error("Error in inflight promise for user:", userId, err);
          this.inflight.delete(key);
          return null;
        });
      }

      //console.log("Cache miss for user:", userId);

      // Create the in-flight promise with timeout (do NOT await here)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          this.inflight.delete(key);
          //console.log(`Request timeout for user: ${userId}`);
          resolve(null);
        }, 5000); // 5 second timeout
      });

      const servicePromise = this.externalService
        .getUser(userId)
        .then((user: MinimalUser) => {
          this.cache.set(key, user);
          this.inflight.delete(key);
          return user;
        })
        .catch((err: any) => {
          this.inflight.delete(key);
          // Handle gRPC "not found" errors gracefully
          if (err?.code === 5 || err?.details?.includes('not found')) {
            //console.log(`User not found in promise: ${userId}`);
            // Cache the null result to prevent repeated requests
            this.cache.set(key, null);
            return null;
          }
          // For other errors, also return null to prevent service disruption
          //console.error(`Error fetching user ${userId}:`, err);
          this.cache.set(key, null);
          return null;
        });

      const promise: Promise<MinimalUser | null> = Promise.race([servicePromise, timeoutPromise]);

      this.inflight.set(key, promise);
      return promise;
    } catch (error: any) {
      // Handle gRPC "not found" errors gracefully
      if (error?.code === 5 || error?.details?.includes('not found')) {
        //console.log(`User not found: ${userId}`);
        // Cache the null result to prevent repeated requests
        const key = `user-${userId}`;
        this.cache.set(key, null);
        return null;
      }

      // Log other errors but still return null to prevent service disruption
      //console.error("Error in getUserDetails:", error);
      return null;
    }
  }

  static async getUserTopic(userTopicId: number): Promise<UserTopic | null> {
    try {
      const key = `topic-${userTopicId}`;

      // Check memory cache
      if (this.cache.has(key)) {
        //console.log("Cache hit for topic:", userTopicId);
        return this.cache.get(key);
      }

      // Reuse in-flight request for topics
      if (this.topicInflight.has(key)) {
        //console.log("Waiting for inflight fetch for topic:", userTopicId);
        const inflightPromise = this.topicInflight.get(key)!;
        // Add a catch to handle any errors in the inflight promise
        return inflightPromise.catch((err) => {
          //console.error("Error in inflight promise for topic:", userTopicId, err);
          this.topicInflight.delete(key);
          return null;
        });
      }

      //console.log("Cache miss for topic:", userTopicId);

      // Create the in-flight promise with timeout (do NOT await here)
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          this.topicInflight.delete(key);
          //console.log(`Request timeout for topic: ${userTopicId}`);
          resolve(null);
        }, 5000); // 5 second timeout
      });

      const servicePromise = this.externalService
        .getUserTopic(userTopicId)
        .then((topic: UserTopic) => {
          this.cache.set(key, topic);
          this.topicInflight.delete(key);
          return topic;
        })
        .catch((err: any) => {
          this.topicInflight.delete(key);
          // Handle gRPC "not found" errors gracefully
          if (err?.code === 5 || err?.details?.includes('not found')) {
            //console.log(`User topic not found in promise: ${userTopicId}`);
            // Cache the null result to prevent repeated requests
            this.cache.set(key, null);
            return null;
          }
          // For other errors, also return null to prevent service disruption
          //console.error(`Error fetching topic ${userTopicId}:`, err);
          this.cache.set(key, null);
          return null;
        });

      const promise: Promise<UserTopic | null> = Promise.race([servicePromise, timeoutPromise]);

      this.topicInflight.set(key, promise);
      return promise;
    } catch (error: any) {
      // Handle gRPC "not found" errors gracefully
      if (error?.code === 5 || error?.details?.includes('not found')) {
        //console.log(`User topic not found: ${userTopicId}`);
        // Cache the null result to prevent repeated requests
        const key = `topic-${userTopicId}`;
        this.cache.set(key, null);
        return null;
      }

      // Log other errors but still return null to prevent service disruption
      //console.error("Error in getUserTopic:", error);
      return null;
    }
  }

  static async getTopic(topicId: number): Promise<Topic | null> {
    try {
      const key = `general-topic-${topicId}`;

      // Check memory cache
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      // Reuse in-flight request for topics
      if (this.generalTopicInflight.has(key)) {
        const inflightPromise = this.generalTopicInflight.get(key)!;
        return inflightPromise.catch((err) => {
          this.generalTopicInflight.delete(key);
          return null;
        });
      }

      // Create the in-flight promise with timeout
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          this.generalTopicInflight.delete(key);
          resolve(null);
        }, 5000); // 5 second timeout
      });

      const servicePromise = this.externalService
        .getTopic(topicId)
        .then((topic: Topic) => {
          this.cache.set(key, topic);
          this.generalTopicInflight.delete(key);
          return topic;
        })
        .catch((err: any) => {
          this.generalTopicInflight.delete(key);
          if (err?.code === 5 || err?.details?.includes('not found') || err?.response?.status === 404) {
            this.cache.set(key, null);
            return null;
          }
          this.cache.set(key, null);
          return null;
        });

      const promise: Promise<Topic | null> = Promise.race([servicePromise, timeoutPromise]);

      this.generalTopicInflight.set(key, promise);
      return promise;
    } catch (error: any) {
      if (error?.code === 5 || error?.details?.includes('not found') || error?.response?.status === 404) {
        const key = `general-topic-${topicId}`;
        this.cache.set(key, null);
        return null;
      }
      return null;
    }
  }

  static async getSubject(subjectId: number): Promise<Subject | null> {
    try {
      const key = `subject-${subjectId}`;

      // Check memory cache
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      // Reuse in-flight request for subjects
      if (this.subjectInflight.has(key)) {
        const inflightPromise = this.subjectInflight.get(key)!;
        return inflightPromise.catch((err) => {
          this.subjectInflight.delete(key);
          return null;
        });
      }

      // Create the in-flight promise with timeout
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          this.subjectInflight.delete(key);
          resolve(null);
        }, 5000); // 5 second timeout
      });

      const servicePromise = this.externalService
        .getSubject(subjectId)
        .then((subject: Subject) => {
          this.cache.set(key, subject);
          this.subjectInflight.delete(key);
          return subject;
        })
        .catch((err: any) => {
          this.subjectInflight.delete(key);
          if (err?.code === 5 || err?.details?.includes('not found') || err?.response?.status === 404) {
            this.cache.set(key, null);
            return null;
          }
          this.cache.set(key, null);
          return null;
        });

      const promise: Promise<Subject | null> = Promise.race([servicePromise, timeoutPromise]);

      this.subjectInflight.set(key, promise);
      return promise;
    } catch (error: any) {
      if (error?.code === 5 || error?.details?.includes('not found') || error?.response?.status === 404) {
        const key = `subject-${subjectId}`;
        this.cache.set(key, null);
        return null;
      }
      return null;
    }
  }

  // Utility methods for cache management
  static clearCache(): void {
    try {
      this.cache.clear();
      this.inflight.clear();
      this.topicInflight.clear();
      this.generalTopicInflight.clear();
      this.subjectInflight.clear();
      //console.log("Cache cleared successfully");
    } catch (error) {
      //console.error("Error clearing cache:", error);
      throw new Error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getCacheStats(): {
    cacheSize: number;
    maxSize: number;
    userInflight: number;
    topicInflight: number;
    generalTopicInflight: number;
    subjectInflight: number;
  } {
    try {
      return {
        cacheSize: this.cache.size,
        maxSize: this.cache.max,
        userInflight: this.inflight.size,
        topicInflight: this.topicInflight.size,
        generalTopicInflight: this.generalTopicInflight.size,
        subjectInflight: this.subjectInflight.size
      };
    } catch (error) {
      //console.error("Error getting cache stats:", error);
      throw new Error(`Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static invalidateUser(userId: string): void {
    try {
      const key = `user-${userId}`;
      this.cache.delete(key);
      this.inflight.delete(key);
      //console.log(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      //console.error("Error invalidating user cache:", error);
      throw new Error(`Failed to invalidate user cache for ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static invalidateTopic(userTopicId: number): void {
    try {
      const key = `topic-${userTopicId}`;
      this.cache.delete(key);
      this.topicInflight.delete(key);
      //console.log(`Cache invalidated for topic: ${userTopicId}`);
    } catch (error) {
      //console.error("Error invalidating topic cache:", error);
      throw new Error(`Failed to invalidate topic cache for ${userTopicId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static invalidateGeneralTopic(topicId: number): void {
    try {
      const key = `general-topic-${topicId}`;
      this.cache.delete(key);
      this.generalTopicInflight.delete(key);
    } catch (error) {
      throw new Error(`Failed to invalidate general topic cache for ${topicId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static invalidateSubject(subjectId: number): void {
    try {
      const key = `subject-${subjectId}`;
      this.cache.delete(key);
      this.subjectInflight.delete(key);
    } catch (error) {
      throw new Error(`Failed to invalidate subject cache for ${subjectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
