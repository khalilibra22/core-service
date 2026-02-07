import { Expose, Transform } from "class-transformer";

export class GroupClassDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

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
  type?: string;

  @Expose()
  status?: string;

  @Expose()
  description?: string;

  @Expose()
  maxParticipants?: number;

  @Expose()
  @Transform(({ obj }) => obj.enrollments?.length || 0)
  participantsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.sessions?.[0]?.date || null)
  startTime?: Date;

  @Expose()
  isRemote?: boolean;

  @Expose()
  price?: number;

  @Expose()
  sellingPrice?: number;

  @Expose()
  couponApplicable?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  language?: string;

  @Expose()
  @Expose()
  @Transform(({ obj, options }) => obj.subject?.name || options?.context?.subjectById?.[obj?.subjectId]?.name)
  subject?: string;

  @Expose()
  @Transform(({ obj, options }) => obj.topic?.name || options?.context?.topicById?.[obj?.couresSettings?.topicId]?.name)
  topic?: string;

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
  @Transform(({ obj, options }) => options?.context?.ownerRatingById?.[obj.ownerId] ?? 0)
  ownerRating?: number;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.ownerReviewsCountById?.[obj.ownerId] ?? 0)
  ownerReviewsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.rating ?? 0)
  courseRating?: number;

  // feild boolean to know if there are enrollments
  // @Expose()
  // @Transform(({ obj }) =>
  //   obj.enrollments && obj.enrollments.length > 0 ? true : false
  // )
  // hasEnrollments?: boolean;

  @Expose()
  groupId?: string;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  creationDate?: Date;
}
