import { Expose, Transform } from "class-transformer";

export class OneOnOneEnollmentDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.id)
  sessionId?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.course?.id)
  courseId?: string;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  studentFullname?: string;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  teacherFullname?: string;

  @Expose()
  topicId?: number;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  topicName?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.course?.price)
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.session?.date)
  date?: Date;

  @Expose()
  @Transform(({ obj }) => obj.session?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.session?.status)
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.duration)
  duration?: number;

  @Expose()
  @Transform(({ obj }) => obj.session?.durationUnit)
  durationUnit?: string;

  @Expose()
  studentId?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.course?.ownerId)
  teacherId?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.course?.type)
  type?: string;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
