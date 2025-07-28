import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { QuizAttemptModel } from "./quizAttempt.model";

@Entity("answers")
export class AnswerModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column("text")
  content?: string;

  @Column({ default: false })
  isCorrect?: boolean;

  @ManyToOne(() => QuizAttemptModel, (attempt) => attempt.answers)
  attempt?: QuizAttemptModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
