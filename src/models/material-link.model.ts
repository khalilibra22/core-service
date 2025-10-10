import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  Index,
} from "typeorm";
import { MaterialModel } from "./material.model";
import { CourseModel } from "./course.model";
import { LessonModel } from "./lesson.model";

@Index("IDX_material_links_course_active", ["course"], { where: "deleted_at IS NULL" })
@Index("IDX_material_links_lesson_active", ["lesson"], { where: "deleted_at IS NULL" })
@Index("UQ_material_links_course_material_active", ["course", "material"], {
  unique: true,
  where: "deleted_at IS NULL",
})
@Index("UQ_material_links_lesson_material_active", ["lesson", "material"], {
  unique: true,
  where: "deleted_at IS NULL",
})
@Entity("material_links")
export class MaterialLinkModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ default: true, name: "is_sharable" })
  isSharable?: boolean;

  @Column({ default: true, name: "is_visible" })
  isVisible?: boolean;

  @Index("IDX_material_links_student_id")
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

