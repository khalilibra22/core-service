import { Expose, Type } from "class-transformer";

export class QuizAttemptDto {
  @Expose()
  id?: string;

  @Expose()
  studentId?: string;

  @Expose()
  score?: number;

  @Expose()
  maxScore?: number;

  @Expose()
  timeTaken?: number;

  @Expose()
  isCompleted?: boolean;

  @Expose()
  createdAt?: Date;
}

export class SubmitQuizAttemptAnswerDto {
  questionId!: string;
  answer!: string;
}

export class SubmitQuizAttemptDto {
  answers!: SubmitQuizAttemptAnswerDto[];
  timeTaken?: number;
}

