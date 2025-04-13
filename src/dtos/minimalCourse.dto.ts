import { Expose } from "class-transformer";

export class MinimalCourseDto {
  @Expose()
  id?: string;

  @Expose()
  type?: string;

  @Expose()
  status?: string;

  @Expose()
  teacherId?: string;
}
