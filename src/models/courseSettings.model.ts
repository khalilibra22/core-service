import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";

@Entity("course_settings")
export class CourseSettingsModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true })
  isPaid?: boolean;

  @Column({ nullable: true, name: "is_remote" })
  isRemote?: boolean;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true, name: "intro_video_url" })
  introVideoUrl?: string;

  @Column({ nullable: true })
  syllabus?: string;

  @Column({ nullable: true, name: "thumbnail_url" })
  thumbnailUrl?: string;

  @Column({ type: "simple-array", nullable: true })
  objectives?: string[];

  @Column({ type: "simple-array", nullable: true })
  prerequisites?: string[];

  @Column({ type: "simple-array", nullable: true, name: "traget_audience" })
  targetAudience?: string[];

  @Column({ nullable: true, name: "is_certified", default: false })
  isCertified?: boolean;

  @Column({ nullable: true, name: "certificate_type" })
  certificateType?: string;

  @Column({ nullable: true, name: "certificate_shipping_type" })
  certificateShippingType?: string;

  @Column({ nullable: true })
  grade?: string;

  @Column({ nullable: true })
  age?: string;

  @Column({ nullable: true, name: "is_canceled", default: false })
  isCanceled?: boolean;

  @Column({ nullable: true, name: "reason_of_cancellation" })
  reasonOfCancellation?: string;

  @Column({ nullable: true, name: "canceled_by" })
  canceledBy?: string;

  @OneToOne(() => CourseModel, (course) => course.couresSettings)
  course?: CourseModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
