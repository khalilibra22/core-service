import { Expose, Transform, Type } from "class-transformer";
import { MaterialDto } from "./material.dto";

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
  @Transform(({ obj, options }) => options?.context?.topicById?.[obj?.topicId]?.name)
  topicName?: string;

  @Expose()
  isPaid?: boolean;

  @Expose()
  status?: string;

  @Expose()
  url?: string;

  @Expose()
  videoUrl?: string;

  @Expose()
  @Type(() => MaterialDto)
  @Transform(({ obj }) => obj.materialLinks)
  materials?: MaterialDto[];
}
