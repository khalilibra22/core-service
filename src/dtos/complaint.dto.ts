import { Expose, Transform } from "class-transformer";

export class ComplaintDto {
  @Expose()
  id?: string;

  // @Expose()
  // studentId?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  type?: string;

  @Expose()
  reason?: string;

  @Expose()
  @Transform(() => "to be filled")
  respondedBy?: string;

  @Expose()
  response?: string;

  @Expose()
  status?: string;
}
