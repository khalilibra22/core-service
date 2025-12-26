import { Expose, Transform, Type } from "class-transformer";

class UserMiniDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  avatar?: string;
}

class TutorResponseDto {
  @Expose()
  message?: string;

  @Expose({ name: "refund_option" })
  refundOption?: string;

  @Expose({ name: "responded_at" })
  respondedAt?: string;
}

export class ComplaintDto {
  @Expose()
  id?: string;

  @Expose({ name: "course_id" })
  @Transform(({ obj }) => obj.course?.id)
  courseId?: string;

  @Expose({ name: "course_name" })
  @Transform(({ obj }) => obj.course?.name)
  courseName?: string;

  @Expose({ name: "session_id" })
  @Transform(({ obj }) => obj.session?.id)
  sessionId?: string;

  @Expose({ name: "session_title" })
  @Transform(({ obj }) => obj.session?.title)
  sessionTitle?: string;

  @Expose({ name: "session_type" })
  @Transform(({ obj }) => obj.session?.course?.type || "individual")
  sessionType?: string;

  @Expose({ name: "session_date" })
  @Transform(({ obj }) => obj.session?.date)
  sessionDate?: string;

  @Expose({ name: "session_duration" })
  @Transform(({ obj }) => obj.session?.duration)
  sessionDuration?: number;

  @Expose({ name: "session_price" })
  @Transform(({ obj }) => obj.session?.price || obj.amount) // Model has amount, session might have price
  sessionPrice?: number;

  @Expose()
  @Type(() => UserMiniDto)
  @Transform(({ obj, options }) => {
    const user = options?.context?.userById?.[obj?.studentId];
    return {
      id: obj.studentId,
      name: user?.fullname,
      avatar: user?.avatar,
    };
  })
  learner?: UserMiniDto;

  @Expose()
  @Type(() => UserMiniDto)
  @Transform(({ obj, options }) => {
    const tutorId = obj.session?.course?.ownerId || obj.enrollment?.teacherId;
    const user = options?.context?.userById?.[tutorId];
    return {
      id: tutorId,
      name: user?.fullname,
      avatar: user?.avatar,
    };
  })
  tutor?: UserMiniDto;

  @Expose()
  reason?: string;

  @Expose()
  description?: string;

  @Expose()
  attachments?: string[];

  @Expose()
  status?: string;

  @Expose({ name: "reference_id" })
  referenceId?: string;

  @Expose({ name: "issue_type" })
  @Transform(({ obj }) => obj.type)
  issueType?: string;

  @Expose({ name: "created_at" })
  createdAt?: string;

  @Expose()
  deadline?: string;

  @Expose({ name: "auto_escalate_at" })
  autoEscalateAt?: string;

  @Expose()
  timeline?: any[];

  @Expose({ name: "refund_amount" })
  @Transform(({ obj }) => obj.amount || 0)
  refundAmount?: number;

  @Expose({ name: "refund_status" })
  @Transform(({ obj }) => obj.refundStatus || "not_applicable")
  refundStatus?: string;

  @Expose({ name: "tutor_response" })
  @Type(() => TutorResponseDto)
  @Transform(({ obj }) => {
    if (obj.status === "pending") return null;
    return {
      message: obj.initialResponse,
      refund_option: obj.refundOption,
      responded_at: obj.updatedAt, // Using updatedAt as respondedAt for simplicity, or add a field
    };
  })
  tutorResponse?: TutorResponseDto;

  @Expose()
  @Transform(({ obj }) => obj.adminResponse || null)
  resolution?: string;
}
