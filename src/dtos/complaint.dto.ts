import { Expose } from "class-transformer";

export class ComplaintDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  type?: string;

  @Expose()
  reason?: string;

  @Expose()
  response?: string;

  @Expose()
  status?: string;
}
