import { Expose, Transform } from "class-transformer";

export class StudentRequestDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj?.studentId]?.fullname)
  studentFullname?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.id)
  courseId?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.name)
  courseName?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.type)
  courseType?: string;

  @Expose()
  type?: string;

  @Expose()
  message?: string;

  @Expose()
  payload?: any;

  @Expose()
  status?: string;

  @Expose()
  ownerResponse?: string;

  @Expose()
  respondedBy?: string;

  @Expose()
  respondedAt?: Date;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}

