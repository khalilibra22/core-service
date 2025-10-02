import { Expose } from "class-transformer";

export class MaterialDto {
  @Expose()
  id?: string;

  @Expose()
  title?: string;

  @Expose()
  type?: string;

  @Expose()
  storageId?: string;

  @Expose()
  size?: string;

  @Expose()
  isSharable?: boolean;

  @Expose()
  isVisible?: boolean;

  @Expose()
  createdAt?: Date;
}
