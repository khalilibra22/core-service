import { Expose, Transform } from "class-transformer";
import { getPermanentUrl } from "../utils";

export class LiveCourseDto {
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
  @Transform(({ obj }) => obj.sessions?.length || 0)
  sessionsCount?: number;

  @Expose()
  ownerId?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.fullname)
  ownerName?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.profilePicture)
  ownerProfilePicture?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.state)
  state?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.district)
  district?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj.ownerId]?.city)
  city?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.ownerRatingById?.[obj.ownerId] ?? 0)
  ownerRating?: number;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.ownerReviewsCountById?.[obj.ownerId] ?? 0)
  ownerReviewsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.rating ?? 0)
  courseRating?: number;

  @Expose()
  maxParticipants?: number;

  @Expose()
  @Transform(({ obj }) => obj.enrollments?.length || 0)
  participantsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.date || null)
  startTime?: Date;

  @Expose()
  @Transform(({ obj }) => obj.instructorId ?? undefined)
  instructor?: string;

  @Expose()
  isRemote?: boolean;

  @Expose()
  price?: number;

  @Expose()
  sellingPrice?: number;

  @Expose()
  couponApplicable?: boolean;

  @Expose()
  language?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.address)
  address?: string;

  @Expose({ name: "introVideo" })
  @Transform(({ obj }) => getPermanentUrl(obj.introVideo))
  introVideo?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.syllabus)
  syllabus?: string;

  @Expose({ name: "thumbnail" })
  @Transform(({ obj }) => getPermanentUrl(obj.thumbnail))
  thumbnail?: string;

  @Expose()
  @Transform(({ obj, options }) => obj.subject?.name || options?.context?.subjectById?.[obj?.subjectId]?.name)
  subject?: string;

  @Expose()
  @Transform(({ obj, options }) => obj.topic?.name || options?.context?.topicById?.[obj?.couresSettings?.topicId]?.name)
  topic?: string;

  @Expose()
  lastPandingRequestsCount?: number;

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
  @Transform(({ obj }) => obj.couresSettings?.accordinationNumber)
  accordinationNumber?: string;

  @Expose()
  @Transform(
    ({ obj }) => obj.couresSettings?.internationalAccordingOrganization
  )
  internationalAccordingOrganization?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.grade)
  grade?: string;

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
  groupId?: string;
}
