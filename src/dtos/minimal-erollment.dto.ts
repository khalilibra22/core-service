import { Expose, Transform } from "class-transformer";

export class MinimalEnrollmentDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.session.title)
  name?: string;

  @Expose()
  @Transform(() => "to be filled")
  topic?: string;

  @Expose()
  @Transform(({ obj }) => obj.session.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(() => "to be filled")
  teacherName?: string;

  @Expose()
  @Transform(() => "to be filled")
  amountPaid?: number;

  @Expose()
  @Transform(({ obj }) => obj.session.duration)
  duration?: number;

  @Expose()
  @Transform(({ obj }) => obj.session.durationUnit)
  durationUnit?: string;

  // @Expose()
  // @Transform(({ obj }) => obj.course?.name)
  // course?: string;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.session.isRemote)
  isRemote?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
