import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { QuizModel } from "./quiz.model";
import { AnswerModel } from "./answer.model";

@Entity("quiz_attempts")
export class QuizAttemptModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ type: "int" })
  score?: number;

  @Column({ name: "max_score", type: "int", nullable: true })
  maxScore?: number;

  @Column({ name: "time_taken", type: "int", nullable: true })
  timeTaken?: number; // in seconds

  @Column({ name: "is_completed", type: "boolean", default: false })
  isCompleted?: boolean;

  @ManyToOne(() => QuizModel, (quiz) => quiz.attempts)
  @JoinColumn({ name: "quiz_id" })
  quiz?: QuizModel;

  @OneToMany(() => AnswerModel, (answer) => answer.attempt, { cascade: true })
  answers?: AnswerModel[];

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;
}
