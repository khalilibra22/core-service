import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseSettingsModel } from "./courseSettings.model";
import { ReviewModel } from "./review.model";
import { CertificateModel } from "./certificate.model";
import { SessionModel } from "./session.model";
import { CourseEnrollmentModel } from "./courseEnrollment.model";
import { QuizModel } from "./quiz.model";

@Entity("courses")
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

  @OneToOne(
    () => CourseSettingsModel,
    (courseSettings) => courseSettings.course,
    { cascade: true }
  )
  @JoinColumn({ name: "courese_settings_id" })
  couresSettings?: CourseSettingsModel;

  @OneToMany(() => SessionModel, (session) => session.course)
  sessions?: SessionModel[];

  @OneToMany(
    () => CourseEnrollmentModel,
    (courseEnrollment) => courseEnrollment.course
  )
  enrollments?: CourseEnrollmentModel[];

  @OneToMany(() => ReviewModel, (review) => review.course)
  reviews?: ReviewModel[];

  @OneToMany(() => CertificateModel, (certificate) => certificate.course)
  certificates?: CertificateModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
