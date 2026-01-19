import { Expose, Transform } from "class-transformer";

export class ComplaintListDto {
    @Expose()
    id?: string;

    @Expose({ name: "session_id" })
    @Transform(({ obj }) => obj.session?.id || obj.enrollment?.id)
    sessionId?: string;

    @Expose({ name: "session_title" })
    @Transform(({ obj }) => obj.session?.title || (obj.enrollment?.type === 'one-on-one' ? 'One-on-One Session' : obj.enrollment?.course?.name))
    sessionTitle?: string;

    @Expose({ name: "session_type" })
    @Transform(({ obj }) => obj.session?.course?.type || obj.enrollment?.type || "individual")
    sessionType?: string;

    @Expose({ name: "learner_id" })
    @Transform(({ obj }) => obj.studentId)
    learnerId?: string;

    @Expose({ name: "learner_name" })
    @Transform(({ obj, options }) => options?.context?.userById?.[obj?.studentId]?.fullname || "Unknown Learner")
    learnerName?: string;

    @Expose({ name: "tutor_id" })
    @Transform(({ obj }) => obj.session?.course?.ownerId || obj.enrollment?.teacherId || obj.enrollment?.course?.ownerId || obj.course?.ownerId)
    tutorId?: string;

    @Expose({ name: "tutor_name" })
    @Transform(({ obj, options }) => {
        const tutorId = obj.session?.course?.ownerId || obj.enrollment?.teacherId || obj.enrollment?.course?.ownerId || obj.course?.ownerId;
        return options?.context?.userById?.[tutorId]?.fullname || "Unknown Tutor";
    })
    tutorName?: string;

    @Expose()
    reason?: string;

    @Expose()
    description?: string;

    @Expose()
    status?: string;

    @Expose({ name: "issue_type" })
    @Transform(({ obj }) => obj.type)
    issueType?: string;

    @Expose({ name: "reference_id" })
    referenceId?: string;

    @Expose({ name: "created_at" })
    createdAt?: string;

    @Expose({ name: "updated_at" })
    updatedAt?: string;

    @Expose()
    deadline?: string;

    @Expose({ name: "refund_amount" })
    @Transform(({ obj }) => obj.amount || 0)
    refundAmount?: number;

    @Expose({ name: "refund_status" })
    @Transform(({ obj }) => obj.refundStatus || "not_applicable")
    refundStatus?: string;
}
