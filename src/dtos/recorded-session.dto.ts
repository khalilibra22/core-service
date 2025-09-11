import { Expose, Transform, Type } from "class-transformer";
import { LessonDto } from "./lesson.dto";
import { QuizDto } from "./quiz.dto";

export class RecordedSessionDto {
  @Expose()
  id?: string;

  @Expose()
  @Transform(({ obj }) => obj.course?.type)
  type?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  order?: number;

  @Expose()
  @Type(() => LessonDto)
  lessons?: LessonDto[];

  @Expose()
  @Type(() => QuizDto)
  quizzes?: QuizDto[];
}
