import { Expose, Transform } from "class-transformer";

export class GroupClassDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  type?: string;

  @Expose()
  description?: string;

  @Expose()
  maxParticipants?: number;

  @Expose()
  @Transform(({ obj }) => obj.enrollments?.length || 0)
  participantsCount?: number;

  @Expose()
  @Transform(({ obj }) => obj.sessions[0]?.date || null)
  startTime?: Date;

  @Expose()
  isRemote?: boolean;

  @Expose()
  price?: number;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(() => "to be filled")
  subject?: string;

  @Expose()
  @Transform(() => "to be filled")
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
  @Transform(({ obj }) => obj.createdAt)
  creationDate?: Date;
}
