import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from "typeorm";
import { MaterialModel } from "./material.model";
import { CourseModel } from "./course.model";
import { LessonModel } from "./lesson.model";

@Entity("material_links")
export class MaterialLinkModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ default: true, name: "is_sharable" })
  isSharable?: boolean;

  @Column({ default: true, name: "is_visible" })
  isVisible?: boolean;

  
  @Column({ type: "uuid", nullable: true, name: "student_id" })
  studentId?: string; // for one on one materials

  @ManyToOne(() => MaterialModel, (material) => material.links, {
    onDelete: "CASCADE",
  })
  material?: MaterialModel;

  @ManyToOne(() => CourseModel, (course) => course.materialLinks, {
    nullable: true,
    onDelete: "CASCADE",
  })
  course?: CourseModel;

  @ManyToOne(() => LessonModel, (lesson) => lesson.materialLinks, {
    nullable: true,
    onDelete: "CASCADE",
  })
  lesson?: LessonModel;

  @CreateDateColumn({ name: "created_at", type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;
}

