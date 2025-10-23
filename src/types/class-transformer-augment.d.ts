import 'class-transformer';
import { MinimalUser, UserTopic } from './user.types';

declare module 'class-transformer' {
  interface ClassTransformOptions {
    context?: {
      userById?: Record<string, MinimalUser | null>;
      topicById?: Record<number, UserTopic | null>;
      [key: string]: any;
    };
  }
}