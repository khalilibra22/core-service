import { Expose, Transform } from "class-transformer";

export class CertificateDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  issueDate?: Date;

  @Expose()
  expirationDate?: Date;

  @Expose()
  status?: string;

  @Expose()
  issuedBy?: string;

  @Expose()
  certificateUrl?: string;
}
