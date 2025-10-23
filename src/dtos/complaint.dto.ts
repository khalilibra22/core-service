import { Expose, Transform } from "class-transformer";

export class ComplaintDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj, options }) => options?.context?.userById?.[obj?.studentId]?.fullname)
  studentFullname?: string;

  @Expose()
  type?: string;

  @Expose()
  reason?: string;

  @Expose()
  initialResponse?: string;

  @Expose()
  studentDecision?: string;

  @Expose()
  adminResponse?: string;

  // @Expose()
  // @Transform(() => "to be filled")
  // respondedBy?: string;
}
