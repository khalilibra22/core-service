import 'class-transformer';

declare module 'class-transformer' {
  interface ClassTransformOptions {
    context?: {
      userById?: Record<string, unknown>;
      topicById?: Record<number, unknown>;
      [key: string]: unknown;
    };
  }
}

