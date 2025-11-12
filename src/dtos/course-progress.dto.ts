import { Expose, Transform } from "class-transformer";

export class CourseProgressDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.id)
  courseId?: string;

  @Expose()
  percentComplete?: number;

  @Expose()
  @Transform(({ obj }) => obj.lastSession?.id)
  lastSessionId?: string;

  @Expose()
  @Transform(({ obj }) => obj.lastLesson?.id)
  lastLessonId?: string;

  @Expose()
  createdAt?: Date;

  @Expose()
  updatedAt?: Date;
}

