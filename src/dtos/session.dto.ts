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

  @Expose()
  @Transform(({ obj, options }) => {
    const studentId = obj.enrollment?.studentId || obj.studentId;
    return options?.context?.userById?.[studentId]?.fullname;
  })
  studentName?: string;

  @Expose()
  @Transform(({ obj, options }) => {
    const teacherId = obj.enrollment?.teacherId || obj.teacherId;
    return options?.context?.userById?.[teacherId]?.fullname;
  })
  teacherName?: string;
}
