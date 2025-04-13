import { Expose } from "class-transformer";

export class ReviewDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  rating?: number;

  @Expose()
  title?: string;

  @Expose()
  comment?: string;
}
