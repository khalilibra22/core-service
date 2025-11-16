import { Expose, Type } from "class-transformer";
import { QuestionDto } from "./question.dto";

export class QuizDto {
  @Expose()
  id?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  timeLimit?: number;

  @Expose()
  maxAttempts?: number;

  @Expose()
  passingScore?: number;

  @Expose()
  order?: number;

  @Expose()
  isActive?: boolean;

  @Expose()
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
