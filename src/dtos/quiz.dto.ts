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
  order?: number;

  @Expose()
  @Type(() => QuestionDto)
  questions?: QuestionDto[];
}
