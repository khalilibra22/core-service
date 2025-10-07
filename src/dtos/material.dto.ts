import { Expose, Transform } from "class-transformer";

export class MaterialDto {
  @Expose()
  @Transform(({ obj }) => obj.material?.id)
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.material?.title)
  title?: string;

  @Expose()
  @Transform(({ obj }) => obj.material?.type)
  type?: string;

  @Expose()
  @Transform(({ obj }) => obj.material?.storageId)
  storageId?: string;

  @Expose()
  @Transform(({ obj }) => obj.material?.size)
  size?: string;

  @Expose()
  isSharable?: boolean;

  @Expose()
  isVisible?: boolean;

  @Expose()
  @Transform(({ obj }) => obj.material?.teacherId ?? undefined)
  teacherId?: string;

  @Expose()
  @Transform(({ obj }) => obj.material?.createdAt)
  createdAt?: Date;
}
