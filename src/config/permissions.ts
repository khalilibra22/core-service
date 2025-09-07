import { UserRole } from "../enums/userRoles.enum";
import { Action, Resource } from "../utils/permissionTypes";

export const permissions: Record<UserRole, Record<Resource, Action[]>> = {
  [UserRole.SUPERVISOR]: {
    enrollments: ["update", "delete", "overview"],
    courses: ["overview", "delete", "update"],
    sessions: ["overview", "update", "delete"],
    reviews: ["delete", "overview"],
    complaints: ["resolve", "delete", "overview"],
    payments: ["delete", "cancel", "overview"],
  },
  [UserRole.TEACHER]: {
    enrollments: ["read", "view", "approve"],
    courses: ["create", "read", "update", "delete", "view", "cancel"],
    sessions: ["create", "read", "update", "delete", "view"],
    reviews: ["read", "view"],
    complaints: ["read", "respond", "view"],
    payments: ["read", "view"],
  },
  [UserRole.STUDENT]: {
    enrollments: ["create", "read", "update", "delete", "list"],
    courses: ["read", "list"],
    sessions: ["read", "list"],
    reviews: ["create", "read", "update", "delete", "list"],
    complaints: ["create", "read", "update", "delete", "list"],
    payments: [],
  },
  [UserRole.ACADEMY]: {
    enrollments: ["read", "view", "approve"],
    courses: ["create", "read", "update", "delete", "view", "cancel"],
    sessions: ["create", "read", "update", "delete", "view"],
    reviews: ["read", "view"],
    complaints: ["respond", "view"],
    payments: ["read", "view"],
  },
  [UserRole.ADMIN]: {
    enrollments: ["create", "read", "update", "delete", "overview"],
    courses: ["read", "delete", "overview"],
    sessions: ["read", "delete", "overview"],
    reviews: ["read", "delete", "overview"],
    complaints: ["read", "resolve", "overview"],
    payments: [],
  },
  [UserRole.ACADEMY_TEACHER]: {
    enrollments: [],
    courses: ["read", "list"],
    sessions: ["read", "list"],
    reviews: [],
    complaints: [],
    payments: [],
  },
  [UserRole.GUEST]: {
    enrollments: [],
    courses: [],
    sessions: [],
    reviews: [],
    complaints: [],
    payments: [],
  },
};
