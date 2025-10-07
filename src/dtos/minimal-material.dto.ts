import { Expose } from "class-transformer";

export class MinimalMaterialDto {
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
  teacherId?: string;
}

