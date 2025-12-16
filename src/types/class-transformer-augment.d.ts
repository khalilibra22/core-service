import 'class-transformer';
import { MinimalUser, UserTopic, Subject } from './user.types';

declare module 'class-transformer' {
  interface ClassTransformOptions {
    context?: {
      userById?: Record<string, MinimalUser | null>;
      topicById?: Record<number, UserTopic | null>;
      subjectById?: Record<number, Subject | null>;
      [key: string]: any;
    };
  }
}