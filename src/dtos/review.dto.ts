import { Expose, Transform } from "class-transformer";

export class ReviewDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  rating?: number;

  @Expose()
  title?: string;

  @Expose()
  comment?: string;
}
