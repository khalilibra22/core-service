import { Expose, Transform } from "class-transformer";

export class SessionTimeChangeRequestDto {
  @Expose()
  id?: string;

  // @Expose()
  // userId?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj?.userId]?.fullname)
  userFullName?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.id)
  sessionId?: string;

  @Expose()
  availabilityId?: string;

  @Expose()
  availabilityException?: Date;

  @Expose()
  requestedTime?: Date;

  @Expose()
  @Transform(({ obj }) => obj.session?.date)
  currentSessionTime?: Date;

  @Expose()
  status?: string;

  @Expose()
  reason?: string;
}
