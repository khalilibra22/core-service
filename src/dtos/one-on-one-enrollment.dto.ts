import { Expose, Transform } from "class-transformer";

export class OneOnOneEnollmentDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  studentFullname?: string;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  teacherFullname?: string;

  @Expose()
  @Transform(() => "to be filled")
  address?: string;

  @Expose()
  topicId?: number;

  @Expose()
  @Transform(({ obj }) => "to be filled")
  topicName?: string;

  @Expose()
  @Transform(() =>
    //random price
    // to be fixed form payment service
    Math.floor(Math.random() * 1000 + 1000)
  )
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.session?.date)
  date?: Date;

  @Expose()
  @Transform(({ obj }) => obj.session?.isPaid)
  isPaid?: boolean;

  @Expose()
  status?: string;

  @Expose()
  @Transform(() =>
    //random duration
    // to be fixed
    Math.floor(Math.random() * 100 + 100)
  )
  duration?: number;

  @Expose()
  @Transform(() => "minutes")
  durationUnit?: string;

  @Expose()
  studentId?: string;

  @Expose()
  teacherId?: string;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.date)
  startDate?: Date;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
