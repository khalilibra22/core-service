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
  @Transform(({ obj }) => obj.ownerId)
  teacherId?: string;

  @Expose()
  isRemote?: boolean;

  @Expose()
  price?: number | string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.topicId)
  topicId?: number;

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
