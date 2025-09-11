type TeacherAndAcademyAction =
  | "grade_students"
  | "make_payments"
  | "upload_materials"
  | "delete_materials"
  | "upload_streaming_materials"
  | "delete_streaming_materials"
  | "cancel_enrollment"
  | "manage_enrollments"
  | "manage_courses"
  | "cancel_course"
  | "manage_sessions"
  | "respond_reviews"
  | "respond_complaints"
  | "approve_course"
  | "assign_teacher"
  | "invite_teacher"
  | "overview_courses"
  | "export_course_data"
  | "request_time_change"
  | "launch_meeting"
  | "end_meeting"
  | "import_course_data";

// Student actions
type StudentAction =
  | "enroll_course"
  | "view_course"
  | "submit_review"
  | "complain"
  | "drop_course"
  | "student_complaint_veiw"
  | "manage_reviews"
  | "join_meeting"
  | "view_grades";

// Admin actions
type AdminAction =
  | "manage_all_courses"
  | "manage_all_sessions"
  | "ban_course"
  | "unban_course"
  | "adjust_course_settings"
  | "manage_all_complaints"
  | "manage_all_enrollments"
  | "manage_all_reviews"
  | "mqanage_all_payments"
  | "overview_platform";

export type Action =
  | "view"
  | "watch_stream"
  | "download_materials"
  | TeacherAndAcademyAction
  | StudentAction
  | AdminAction;

export type Resource =
  | "enrollments"
  | "courses"
  | "sessions"
  | "reviews"
  | "complaints"
  | "payments";
