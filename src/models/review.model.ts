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

@Entity("reviews")
@Index("IDX_reviews_course_id", ["course"])
@Index("IDX_reviews_student_id", ["studentId"])
@Index("IDX_reviews_teacher_id", ["teacherId"])
@Index("IDX_reviews_rating", ["rating"])
@Index("IDX_reviews_created_at", ["createdAt"])
export class ReviewModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @Column({ name: "teacher_id", nullable: true })
  teacherId?: string; // Optional field for one on one reviews

  @Column()
  rating?: number;

  @Column({ nullable: true })
  title?: string;

  @Column()
  comment?: string;

  @ManyToOne(() => CourseModel, (course) => course.reviews)
  course?: CourseModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
