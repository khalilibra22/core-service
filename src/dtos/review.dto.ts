import { Expose, Transform } from "class-transformer";

export class ReviewDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  @Transform(({ obj }) => (obj.teacherId ? "to be filled" : undefined))
  teacherFullname?: string;

  @Expose()
  rating?: number;

  @Expose()
  title?: string;

  @Expose()
  comment?: string;
}
