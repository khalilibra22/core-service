import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { QuizModel } from "./quiz.model";

@Entity("questions")
export class QuestionModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "text" })
  question?: string;

  @Column({
    type: "enum",
    enum: ["multiple-choice", "true-false"],
    default: "multiple-choice",
  })
  type?: string;

  @Column({ type: "int", default: 1 })
  points?: number;

  @Column({ type: "text", nullable: true })
  explanation?: string;

  @Column({ type: "json", nullable: true })
  options?: string[]; // For multiple-choice questions

  @Column({ type: "boolean", nullable: true })
  isCorrect?: boolean; // For true/false questions

  @Column({ type: "text", nullable: true })
  answer?: string;

  @ManyToOne(() => QuizModel, (quiz) => quiz.questions, {
    onDelete: "CASCADE",
  })
  quiz?: QuizModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
