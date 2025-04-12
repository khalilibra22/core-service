import { Expose, Transform } from "class-transformer";

export class PrerecordedCourseDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  type?: string;

  @Expose()
  description?: string;

  @Expose()
  teacherId?: string;

  @Expose()
  isRemote?: boolean;

  @Expose()
  price?: number | string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.isPaid)
  isPaid?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.address)
  address?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.introVideo)
  introVideoUrl?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.syllabus)
  syllabus?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.thumbnail)
  thumbnailUrl?: string;

  @Expose()
  @Transform(({ obj }) => obj.couresSettings?.topicId)
  topicId?: number;

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
}
