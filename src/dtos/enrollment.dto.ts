import { Expose, Transform } from "class-transformer";

export class EnrollmentDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  @Transform(({ obj }) => obj.course.ownerId)
  teacherId?: string;

  @Expose()
  studentEmail?: string;

  @Expose()
  studentPhone?: string;

  @Expose()
  @Transform(({ obj }) => obj.course.id)
  courseId?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.studentId]?.fullname)
  studentFullname?: string;

  @Expose()
  @Transform(({ obj, options }) => {
    const teacherId = obj.teacherId || obj.course?.ownerId;
    return options?.context?.userById?.[teacherId]?.fullname;
  })
  teacherFullname?: string;

  @Expose()
  @Transform(({ obj, options }) => {
    const teacherId = obj.teacherId || obj.course?.ownerId;
    return options?.context?.userById?.[teacherId]?.address;
  })
  address?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.name)
  name?: string;

  @Expose()
  @Transform(({ obj }) => {
    // If sessions exist, sum their duration or just pick the first one
    return obj.course?.sessions?.[0]?.duration;
  })
  duration?: number;

  @Expose()
  @Transform(({ obj }) => obj.course?.sessions?.[0]?.durationUnit || "minutes")
  durationUnit?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.sessions?.[0]?.date)
  startDate?: Date;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.isRemote)
  isRemote?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.course?.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.course?.price)
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;

  @Expose()
  @Transform(({ obj }) => obj.course?.groupId ?? "")
  groupId?: string;

  @Expose()
  amount?: number;

  @Expose()
  currency?: string;

  @Expose()
  paymentId?: string;

  @Expose()
  paymentProvider?: string;

  @Expose()
  paymentStatus?: string;
}
