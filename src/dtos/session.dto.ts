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
  duration?: number;

  @Expose()
  durationUnit?: string;

  @Expose()
  topicId?: number;

  @Expose()
  isPaid?: boolean;

  @Expose()
  isReserved?: boolean;

  @Expose()
  status?: string;

  title?: string;

  url?: string;

  videoUrl?: string;
}
