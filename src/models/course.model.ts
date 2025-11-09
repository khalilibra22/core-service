import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseSettingsModel } from "./course-settings.model";
import { ReviewModel } from "./review.model";
import { CertificateModel } from "./certificate.model";
import { SessionModel } from "./session.model";
import { EnrollmentModel } from "./enrollment.model";
import { MaterialLinkModel } from "./material-link.model";
import { StudentRequestModel } from "./student-request.model";
import { CourseViewModel } from "./course-view.model";

@Entity("courses")
@Index("IDX_courses_type", ["type"])
@Index("IDX_courses_status", ["status"])
@Index("IDX_courses_owner_id", ["ownerId"])
@Index("IDX_courses_instructor_id", ["instructorId"])
@Index("IDX_courses_type_status", ["type", "status"])
@Index("IDX_courses_price", ["price"])
@Index("IDX_courses_language", ["language"])
@Index("IDX_courses_created_at", ["createdAt"])
export class CourseModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true })
  name?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: "draft" })
  status?: string; // "draft" | "published";

  @Column()
  type?: string; // "one_on_one" | "group" | "live" | "prerecorded";

  @Column({ nullable: true })
  ownerId?: string; // userId of the course owner : teacher or academy

  @Column({ nullable: true })
  instructorId?: string; // userId of the instructor ; this field used by the academy to assign an instructor to the course

  @Column({ default: true, name: "is_remote" })
  isRemote?: boolean;

  @Column({ nullable: true })
  maxParticipants?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  sellingPrice?: number;

  @Column({ default: false, name: "coupon_applicable" })
  couponApplicable?: boolean;

  @Column({ nullable: true })
  language?: string;

  @Column({ name: "intro_video", nullable: true })
  introVideo?: string;

  @Column({ nullable: true })
  thumbnail?: string;

  @OneToOne(
    () => CourseSettingsModel,
    (courseSettings) => courseSettings.course,
    { cascade: true }
  )
  @JoinColumn({ name: "courese_settings_id" })
  couresSettings?: CourseSettingsModel;

  @OneToMany(() => SessionModel, (session) => session.course)
  sessions?: SessionModel[];

  @OneToMany(() => EnrollmentModel, (enrollment) => enrollment.course)
  enrollments?: EnrollmentModel[];

  @OneToMany(() => ReviewModel, (review) => review.course)
  reviews?: ReviewModel[];

  @OneToMany(() => CertificateModel, (certificate) => certificate.course)
  certificates?: CertificateModel[];

  @OneToMany(() => MaterialLinkModel, (link) => link.course, {
    cascade: true,
  })
  materialLinks?: MaterialLinkModel[];

  @OneToMany(() => StudentRequestModel, (request) => request.course)
  studentRequests?: StudentRequestModel[];

  @OneToMany(() => CourseViewModel, (view) => view.course)
  courseViews?: CourseViewModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
