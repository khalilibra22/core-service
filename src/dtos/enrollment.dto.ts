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
  studentFullname?: string;

  @Expose()
  teacherFullname?: string;

  @Expose()
  address?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.name)
  name?: string;

  @Expose()
  @Transform(() =>
    //random duration
    Math.floor(Math.random() * 100 + 100)
  )
  duration?: number;

  @Expose()
  @Transform(() => "minutes")
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
  price?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
