import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SessionEnrollmentModel } from "./sessionEnrollment.model";
import { CourseEnrollmentModel } from "./courseEnrollment.model";

@Entity("refunds")
export class RefundModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id", nullable: true })
  studentId?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  amount?: number; // Refund amount

  // Workflow status
  @Column({ default: "pending" })
  status?: "pending" | "responded" | "resolved" | "escalated";

  @Column({ nullable: true })
  reason?: string;

  // Initial response by teacher/academy
  @Column({ name: "initial_response", nullable: true })
  initialResponse?: string;

  // Student decision after initial response
  @Column({ name: "student_decision", nullable: true })
  studentDecision?: "accepted" | "escalated";

  // Final admin response if escalated
  @Column({ name: "admin_response", nullable: true })
  adminResponse?: string;

  @Column({ name: "processed_by", nullable: true })
  processedBy?: string; // admin/staff who processed the refund

  // Refund is always linked to an enrollment
  @ManyToOne(() => SessionEnrollmentModel, (enrollment) => enrollment.refunds)
  oneOneOneEnrollment?: SessionEnrollmentModel;

  @ManyToOne(() => CourseEnrollmentModel, (enrollment) => enrollment.refunds)
  courseEnrollment?: CourseEnrollmentModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
