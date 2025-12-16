import 'class-transformer';
import { MinimalUser, UserTopic, Topic, Subject } from './user.types';

declare module 'class-transformer' {
  interface ClassTransformOptions {
    context?: {
      userById?: Record<string, MinimalUser | null>;
      topicById?: Record<number, Topic | null>;
      subjectById?: Record<number, Subject | null>;
      [key: string]: any;
    };
  }
}