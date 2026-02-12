export interface MinimalUser {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  address: string;
  state: string;
  district: string;
  city: string;
  fcmToken: string;
  profilePicture: string;
  role: number; // UserRole enum
}

export interface Topic {
  id: number;
  name: string;
  price?: number;
}

export interface Subject {
  id: number;
  name: string;
}

export interface UserTopic {
  id: string;
  topic: Topic;
  price: number;
}

export interface GetUserTopicsRequest {
  user_topic_id: number;
}

export interface GetUserRequest {
  user_id: string;
}

export interface GetUserByEmailRequest {
  email: string;
}