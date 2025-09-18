import { Expose, Transform } from "class-transformer";

export class OneOnOneEnollmentDto {
  @Expose()
  id?: string;

  @Expose()
  studentFullname?: string;

  @Expose()
  teacherFullname?: string;

  @Expose()
  address?: string;

  @Expose()
  topicId?: number;

  @Expose()
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
