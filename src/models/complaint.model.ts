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

@Entity("complaints")
export class ComplaintModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ name: "complaint_type", default: "general" })
  type?: string; // Type of complaint (e.g., general, technical, content-related, etc.)

  @Column({ name: "reason" })
  reason?: string;

  @Column({ name: "response", nullable: true })
  response?: string; // Response from the admin or support team

  @Column({ default: "pending" })
  status?: string; // Status of the complaint (e.g., pending, resolved, escalated, etc.)

  @ManyToOne(() => SessionModel, (session) => session.complaints)
  session?: SessionModel;

  @Column({ name: "admin_id", nullable: true })
  adminId?: string; // ID of the admin or support team member handling the complaint

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
