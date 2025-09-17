import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";
import { QuestionModel } from "./question.model";
import { QuizAttemptModel } from "./quiz-attempt.model";
import { SessionModel } from "./session.model";

@Entity("quizzes")
@Index("IDX_quizzes_session_id", ["session"])
@Index("IDX_quizzes_is_active", ["isActive"])
@Index("IDX_quizzes_order", ["order"])
export class QuizModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  title?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int", default: 10 })
  timeLimit?: number; // in minutes

  @Column({ type: "int", default: 1 })
  maxAttempts?: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  passingScore?: number;

  @Column({ type: "int", default: 0 })
  order?: number;

  @Column({ default: true, name: "is_active" })
  isActive?: boolean;

  @ManyToOne(() => SessionModel, (session) => session.quizzes)
  session?: SessionModel;

  @OneToMany(() => QuestionModel, (question) => question.quiz)
  questions?: QuestionModel[];

  @OneToMany(() => QuizAttemptModel, (attempt) => attempt.quiz, {
    cascade: true,
  })
  attempts?: QuizAttemptModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({
    type: "timestamp",
  })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp", nullable: true })
  deletedAt?: Date;
}
