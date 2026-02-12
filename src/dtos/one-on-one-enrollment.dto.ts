import { Expose, Transform, Type } from "class-transformer";
import { MaterialDto } from "./material.dto";

export class OneOnOneEnollmentDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.studentId]?.fullname)
  studentFullname?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.teacherId]?.fullname)
  teacherFullname?: string;

  @Expose()
  address?: string;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.topicId)
  topicId?: number;

  @Expose()
  @Transform(({ obj, options }) => {
    const topicId = obj.sessions?.[0]?.topicId;
    return options?.context?.topicById?.[topicId]?.name;
  })
  topicName?: string;

  @Expose()
  @Transform(({ obj, options }) => {
    const topicId = obj.sessions?.[0]?.topicId;
    return options?.context?.topicById?.[topicId]?.price;
  })
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.session?.date || obj.sessions?.[0]?.date)
  date?: Date;

  @Expose()
  @Transform(({ obj }) => obj.session?.isPaid || obj.sessions?.[0]?.isPaid)
  isPaid?: boolean;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.duration)
  duration?: number;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.durationUnit || "minutes")
  durationUnit?: string;

  @Expose()
  studentId?: string;

  @Expose()
  teacherId?: string;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.date)
  startDate?: Date;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;

  @Expose()
  groupId?: string;

  @Expose()
  @Type(() => MaterialDto)
  @Transform(({ obj }) => obj.materialLinks)
  materials?: MaterialDto[];
}
