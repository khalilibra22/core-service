import { Expose } from "class-transformer";

export class QuizDto {
  @Expose()
  id?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  order?: number;
}
