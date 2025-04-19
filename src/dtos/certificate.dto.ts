import { Expose } from "class-transformer";

export class CertificateDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

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
