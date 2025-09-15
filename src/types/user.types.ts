import { UserRole } from "../enums/user-roles.enum";

export interface UserType {
  id: string;
  fullname: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  address?: string;
}

export interface UserTopicType {
  id: number;
  price: number;
  topic: TopicType;
}

interface TopicType {
  id: number;
  name: string;
  description: string;
}
