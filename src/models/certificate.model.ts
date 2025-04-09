import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";

@Entity("certificates")
export class CertificateModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  courseId?: string;

  @Column({ name: "issue_date", type: "timestamp", nullable: true })
  issueDate?: Date;

  @Column({ name: "expiration_date", type: "timestamp", nullable: true })
  expirationDate?: Date;

  @Column({ nullable: true, default: "active" })
  status?: string;

  @Column({ name: "issued_by", nullable: true })
  issuedBy?: string;

  @Column({ name: "certificate_url", nullable: true })
  certificateUrl?: string;

  @ManyToOne(() => CourseModel, (course) => course.certificates)
  course?: CourseModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
