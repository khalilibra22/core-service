import { Expose, Transform } from "class-transformer";

export class RefundDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  status?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  type?: string;

  @Expose()
  amount?: number;

  @Expose()
  reason?: string;

  @Expose()
  initialResponse?: string;

  @Expose()
  studentDecision?: string;

  @Expose()
  adminResponse?: string;
}
