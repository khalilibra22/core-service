import { Expose, Transform } from "class-transformer";

export class ReviewDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj?.studentId]?.fullname)
  studentFullname?: string;

  @Expose()
  @Transform(({ obj, options }) => obj.teacherId ? options?.context?.userById?.[obj?.teacherId]?.fullname : undefined)
  teacherFullname?: string;

  @Expose()
  rating?: number;

  @Expose()
  title?: string;

  @Expose()
  comment?: string;
}
