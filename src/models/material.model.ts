import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
} from "typeorm";
import { CourseModel } from "./course.model";
import { LessonModel } from "./lesson.model";

@Entity("materials")
export class MaterialModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: "bigint", nullable: true })
  size?: string;

  @Column({ nullable: true, name: "storage_id" })
  storageId?: string;

  @Column({ type: "uuid", nullable: true, name: "uploaded_by" })
  uploadedBy?: string; // userId

  @Column({ type: "text", nullable: true, name: "related_type" })
  relatedType?: string; // e.g. 'course', 'message', 'quiz'

  @Column({ type: "uuid", nullable: true, name: "related_id" })
  relatedId?: string;

  @Column({ default: true, name: "is_sharable" })
  isSharable?: boolean;

  @Column({ default: true, name: "is_visible" })
  isVisible?: boolean;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => CourseModel, (course) => course.materials)
  course?: CourseModel;

  @ManyToOne(() => LessonModel, (lesson) => lesson.materials)
  lesson?: LessonModel;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
  })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;
}
