import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";
import { SessionModel } from "./session.model";
import { LessonModel } from "./lesson.model";

@Entity("course_progress")
@Index("IDX_course_progress_student_id", ["studentId"])
@Index("IDX_course_progress_student_course", ["studentId", "course"], { unique: true })
@Index("IDX_course_progress_updated_at", ["updatedAt"])
export class CourseProgressModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ name: "student_id" })
  studentId?: string;

  @ManyToOne(() => CourseModel, (course) => course.courseProgress)
  course?: CourseModel;

  @Column({ name: "percent_complete", type: "decimal", precision: 5, scale: 2, default: 0 })
  percentComplete?: number;

  @ManyToOne(() => SessionModel, { nullable: true })
  lastSession?: SessionModel;

  @ManyToOne(() => LessonModel, { nullable: true })
  lastLesson?: LessonModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;
}

