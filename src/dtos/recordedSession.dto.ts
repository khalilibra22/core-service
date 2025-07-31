import { Expose, Transform } from "class-transformer";

export class RecordedSessionDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.type)
  type?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;
}
