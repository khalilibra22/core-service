import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";
import { ComplaintModel } from "./complaint.model";

@Entity("course_enrollments")
export class CourseEnrollmentModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ default: "pending" })
  status?: string; // "pending" | "approved" | "rejected"

  @ManyToOne(() => CourseModel, (course) => course.enrollments)
  course?: CourseModel;

  // @OneToMany(() => RefundModel, (refund) => refund.courseEnrollment)
  // refunds?: RefundModel[];

  @OneToMany(() => ComplaintModel, (refund) => refund.courseEnrollment)
  refunds?: ComplaintModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
