import { Expose, Transform } from "class-transformer";

export class EnrollmentDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  @Transform(() => "to be filled")
  studentFullname?: string;

  @Expose()
  @Transform(() => "to be filled")
  teacherFullname?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.name)
  course?: string;

  @Expose()
  status?: string;

  @Expose()
  @Transform(({ obj }) => obj.createdAt)
  enrollmentDate?: Date;
}
