import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SessionModel } from "./session.model";
import { EnrollmentModel } from "./enrollment.model";

@Entity("complaints")
@Index("IDX_complaints_student_id", ["studentId"])
@Index("IDX_complaints_type", ["type"])
@Index("IDX_complaints_status", ["status"])
@Index("IDX_complaints_resolved_by", ["resolvedBy"])
@Index("IDX_complaints_created_at", ["createdAt"])
@Index("IDX_complaints_session_id", ["session"])
@Index("IDX_complaints_enrollment_id", ["enrollment"])
@Index("IDX_complaints_type_status", ["type", "status"])
@Index("IDX_complaints_student_status", ["studentId", "status"])
export class ComplaintModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ name: "complaint_type", default: "general" })
  type?: string; // Type of complaint (e.g., general, technical, content-related, etc.)

  @Column({ name: "reason" })
  reason?: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  amount?: number; // Refund amount

  // --- Response from Teacher or Academy (first responder) ---
  @Column({ name: "initial_response", nullable: true })
  initialResponse?: string;

  // --- Whether the student accepted or escalated the first response ---
  @Column({ name: "student_decision", nullable: true })
  studentDecision?: "accepted" | "escalated";

  // --- Admin’s response if escalated ---
  @Column({ name: "admin_response", nullable: true })
  adminResponse?: string;

  // --- Complaint status workflow ---
  @Column({
    type: "enum",
    enum: ["pending", "responded", "resolved", "escalated", "closed"],
    default: "pending",
  })
  status?: "pending" | "responded" | "resolved" | "escalated" | "closed";

  @Column({ name: "description", type: "text", nullable: true })
  description?: string;

  @Column({ name: "attachments", type: "json", nullable: true })
  attachments?: string[];

  @Column({ name: "deadline", type: "timestamp", nullable: true })
  deadline?: Date;

  @Column({
    name: "refund_option",
    type: "enum",
    enum: ["refund_100", "refund_50", "refund_0"],
    nullable: true,
  })
  refundOption?: "refund_100" | "refund_50" | "refund_0";

  @Column({
    name: "refund_status",
    type: "enum",
    enum: ["not_applicable", "pending", "completed", "failed"],
    default: "not_applicable",
  })
  refundStatus?: "not_applicable" | "pending" | "completed" | "failed";

  @Column({ name: "resolved_by", nullable: true })
  resolvedBy?: string; // ID of user who resolved the complaint (e.g., admin or support staff)

  @ManyToOne(() => SessionModel, (session) => session.complaints)
  session?: SessionModel;

  @ManyToOne(() => EnrollmentModel, (enrollment) => enrollment.refunds)
  enrollment?: EnrollmentModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
