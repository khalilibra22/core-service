import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SessionModel } from "./session.model";
import { ComplaintModel } from "./complaint.model";

@Entity("session_enrollments")
export class SessionEnrollmentModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ name: "teacher_id", nullable: true })
  teacherId?: string;

  @Column({ nullable: true })
  reason?: string;

  @Column({ name: "canceld_by", nullable: true })
  canceledBy?: string;

  @OneToMany(() => SessionModel, (session) => session.enrollment, {
    cascade: true,
  })
  sessions?: SessionModel[];

  // @OneToMany(() => RefundModel, (refund) => refund.oneOneOneEnrollment)
  // refunds?: RefundModel[];

  @OneToMany(() => ComplaintModel, (refund) => refund.courseEnrollment)
  refunds?: ComplaintModel[];

  @Column({ default: "pending" })
  status?: string; // "pending", "confirmed", "canceled", "completed"

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
