import { Expose } from "class-transformer";

export class QuestionDto {
  @Expose()
  id?: string;

  @Expose()
  question?: string;

  @Expose()
  options?: string[];

  @Expose()
  explanation?: string;

  @Expose()
  points?: number;

  @Expose()
  answer?: string;
}
