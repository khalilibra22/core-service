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
import { ComplaintModel } from "./complaint.model";
import { ReviewModel } from "./review.model";
import { CertificateModel } from "./certificate.model";
import { SessionModel } from "./session.model";

@Entity("courses")
export class CourseModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  name?: string;

  @Column()
  description?: string;

  @Column()
  teacherId?: string;

  @Column()
  type?: string; // "one_on_one" | "group" | "live" | "prerecorded";

  @Column({ nullable: true })
  maxParticipants?: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  price?: number;

  @OneToOne(
    () => CourseSettingsModel,
    (courseSettings) => courseSettings.course
  )
  @JoinColumn({ name: "courese_settings_id" })
  couresSettings?: CourseSettingsModel;

  @OneToMany(() => SessionModel, (session) => session.course)
  sessions?: SessionModel[];

  @OneToMany(() => ComplaintModel, (complaint) => complaint.course)
  complaints?: ComplaintModel[];

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
