export type KeyValue = Record<string, string>;

export type NotificationSendDto = {
  title: string;
  body: string;
  data?: KeyValue;
  imageUrl?: string;
  tokens: string[];
  android?: Record<string, any>;
  apns?: Record<string, any>;
  webpush?: Record<string, any>;
};

export type TopicSendDto = {
  title: string;
  body: string;
  data?: KeyValue;
  imageUrl?: string;
  topic: string;
  android?: Record<string, any>;
  apns?: Record<string, any>;
  webpush?: Record<string, any>;
};


