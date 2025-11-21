import { Expose, Transform, Type } from "class-transformer";
import { getPermanentUrl } from "../utils";
import { RecordedSessionDto } from "./recorded-session.dto";

export class PrerecordedCourseDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  type?: string;

  @Expose()
  status?: string;

  @Expose()
  description?: string;

  @Expose()
  //@Transform(({ obj }) => obj.ownerId)
  ownerId?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.fullname)
  ownerName?: string;


  @Expose()
  price?: number;

  @Expose()
  sellingPrice?: number;

  @Expose()
  couponApplicable?: boolean;

  @Expose()
  language?: string;

  @Expose()
  @Transform(({ obj }) => obj.enrollments?.length ?? 0)
  enrollmentsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.length ?? 0)
  sectionsCount?: number;

  @Expose()
  @Transform(
    () =>
      //random number between 1 and 5
      Math.floor(Math.random() * 5) + 1
  )
  ownerRating?: number;

  @Expose()
  @Transform(
    () =>
      //random number between 1 and 5
      Math.floor(Math.random() * 5) + 1
  )
  courseRating?: number;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.address)
  address?: string;

  @Expose()
  @Transform(({ obj }) => getPermanentUrl(obj.introVideo))
  introVideo?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.syllabus)
  syllabus?: string;

  @Expose({ name: "thumbnail" })
  @Transform(({ obj }) => getPermanentUrl(obj.thumbnail))
  thumbnail?: string;

  // @Expose()
  // @Transform(({ obj }) => obj.couresSettings?.topicId)
  // topicId?: number;

  // @Expose()
  // @Transform(({ obj, options }) => options?.context?.topicById?.[obj.topicId]?.topic?.name)
  // topic?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.objectives)
  objectives?: string[];

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.prerequisites)
  prerequisites?: string[];

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.targetAudience)
  targetAudience?: string[];

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isCertified)
  isCertified?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.certificateType)
  certificateType?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.certificateShippingType)
  certificateShippingType?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.grade)
  grade?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.age)
  age?: number;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isCanceled)
  isCanceled?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.reasonOfCancellation)
  reasonOfCancellation?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.canceledBy)
  canceledBy?: string;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  creationDate?: Date;

  @Expose()
  @Transform(({ obj }) => obj.viewsCount ?? 0)
  viewsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.last24hStudentRequestsCount ?? 0)
  last24hStudentRequestsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.last24hPendingStudentRequestsCount ?? 0)
  last24hPendingStudentRequestsCount?: number;

  @Expose()
  groupId?: string;

  @Expose({ name: "sessions" })
  @Type(() => RecordedSessionDto)
  sections?: RecordedSessionDto[];
}
