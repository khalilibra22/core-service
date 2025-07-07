import { Expose, Transform } from "class-transformer";

export class SessionTimeChangeRequestDto {
  @Expose()
  id?: string;

  // @Expose()
  // userId?: string;

  @Expose()
  @Transform(() => "to be filled")
  userFullName?: string;

  @Expose()
  @Transform(({ obj }) => obj.session?.id)
  sessionId?: string;

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
