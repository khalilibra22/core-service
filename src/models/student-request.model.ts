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
import { CourseModel } from "./course.model";

@Entity("student_requests")
@Index("IDX_student_requests_student_id", ["studentId"])
@Index("IDX_student_requests_course_id", ["course"])
@Index("IDX_student_requests_status", ["status"])
@Index("IDX_student_requests_type", ["type"])
@Index("IDX_student_requests_created_at", ["createdAt"])
@Index("IDX_student_requests_student_status", ["studentId", "status"])
@Index("IDX_student_requests_type_status", ["type", "status"])
export class StudentRequestModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  studentId?: string;

  @Column()
  type?: string; // "certificate" | "refund" | "general" | etc.

  @Column({ type: "text", nullable: true })
  message?: string;

  @Column({ type: "json", nullable: true })
  payload?: any; // Additional data specific to request type

  @Column({ default: "pending" })
  status?: string; // "pending" | "approved" | "rejected" | "completed"

  @Column({ type: "text", nullable: true })
  ownerResponse?: string;

  @Column({ nullable: true })
  respondedBy?: string; // userId of the person who responded (owner/instructor)

  @Column({ type: "timestamp", nullable: true })
  respondedAt?: Date;

  @ManyToOne(() => CourseModel, (course) => course.studentRequests)
  course?: CourseModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}

