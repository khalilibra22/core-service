import { Expose, Transform } from "class-transformer";

export class MinimalEnrollmentDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  topic?: string;

  @Expose()
  isPaid?: boolean;

  @Expose()
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.course?.name)
  course?: string;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
