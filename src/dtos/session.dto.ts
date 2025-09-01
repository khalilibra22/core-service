import { Expose, Transform } from "class-transformer";

export class SessionDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.type)
  type?: string;

  @Expose()
  date?: Date;

  @Expose()
  title?: string;

  @Expose()
  duration?: number;

  @Expose()
  durationUnit?: string;

  @Expose()
  topicId?: number;

  @Expose()
  @Transform(() => "to be filled")
  topicName?: string;

  @Expose()
  isPaid?: boolean;

  @Expose()
  status?: string;

  url?: string;

  videoUrl?: string;
}
