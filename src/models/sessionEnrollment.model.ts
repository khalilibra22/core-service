import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SessionModel } from "./session.model";

@Entity("session_enrollments")
export class SessionEnrollmentModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @ManyToOne(() => SessionModel, (session) => session.enrollments)
  session?: SessionModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
