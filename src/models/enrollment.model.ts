import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";
import { ComplaintModel } from "./complaint.model";
import { SessionModel } from "./session.model";

@Entity("enrollments")
@Index("IDX_enrollments_student_id", ["studentId"])
@Index("IDX_enrollments_teacher_id", ["teacherId"])
@Index("IDX_enrollments_type", ["type"])
@Index("IDX_enrollments_status", ["status"])
@Index("IDX_enrollments_student_type_status", ["studentId", "type", "status"])
@Index("IDX_enrollments_created_at", ["createdAt"])
export class EnrollmentModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ name: "teacher_id", nullable: true })
  teacherId?: string;

  @Column({ default: "course" })
  type?: "course" | "one-on-one";

  @Column({ default: "pending" })
  status?: string; // "pending" | "approved" | "rejected"

  @Column({ name: "cancellation_reason", nullable: true })
  cancellationReason?: string;

  @Column({ name: "canceld_by", nullable: true })
  canceledBy?: string;

  @OneToMany(() => SessionModel, (session) => session.enrollment, {
    cascade: true,
  })
  sessions?: SessionModel[];

  @ManyToOne(() => CourseModel, (course) => course.enrollments)
  course?: CourseModel;

  @OneToMany(() => ComplaintModel, (refund) => refund.enrollment)
  refunds?: ComplaintModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
