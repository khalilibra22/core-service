import { UserRole } from "../enums/user-roles.enum";
import { Action, Resource } from "../utils/permission-types";

export const permissions: Record<UserRole, Record<Resource, Action[]>> = {
  [UserRole.SUPERVISOR]: {
    enrollments: ["manage_enrollments"],
    courses: ["manage_all_courses", "view"],
    sessions: ["manage_all_sessions", "view"],
    reviews: ["manage_all_reviews"],
    complaints: ["manage_all_complaints"],
    payments: ["mqanage_all_payments"],
  },
  [UserRole.TEACHER]: {
    enrollments: ["manage_enrollments", "cancel_enrollment"],
    courses: ["manage_courses", "cancel_course", "view"],
    sessions: ["manage_sessions", "view", "request_time_change"],
    reviews: ["respond_reviews", "view"],
    complaints: ["respond_complaints"],
    payments: [],
  },
  [UserRole.STUDENT]: {
    enrollments: ["enroll_course", "cancel_enrollment", "view"],
    courses: ["view_course", "download_materials", "view"],
    sessions: ["view", "request_time_change"],
    reviews: ["submit_review", "manage_reviews", "view"],
    complaints: ["complain", "student_complaint_veiw"],
    payments: ["make_payments"],
  },
  [UserRole.ACADEMY]: {
    enrollments: ["manage_enrollments", "cancel_enrollment"],
    courses: ["manage_courses", "cancel_course", "view", "assign_teacher"],
    sessions: ["manage_sessions", "view", "request_time_change"],
    reviews: ["respond_reviews", "view"],
    complaints: ["respond_complaints"],
    payments: ["make_payments"],
  },
  [UserRole.ADMIN]: {
    enrollments: ["manage_enrollments"],
    courses: ["manage_all_courses", "view"],
    sessions: ["manage_all_sessions"],
    reviews: ["manage_all_reviews"],
    complaints: ["manage_all_complaints"],
    payments: [],
  },
  [UserRole.ACADEMY_TEACHER]: {
    enrollments: [],
    courses: ["view"],
    sessions: ["view"],
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
