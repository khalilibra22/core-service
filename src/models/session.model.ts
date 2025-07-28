import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { CourseModel } from "./course.model";
import { SessionTimeChangeRequestModel } from "./sessionTimeChangeRequest.model";
import { SessionEnrollmentModel } from "./sessionEnrollment.model";
import { ComplaintModel } from "./complaint.model";

@Entity("sessions")
export class SessionModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "timestamp", nullable: true })
  date?: Date;

  @Column({ nullable: true, type: "decimal", precision: 10, scale: 2 })
  duration?: number;

  @Column({ nullable: true })
  durationUnit?: string; // "hours" | "minutes"

  @Column({ name: "topic_id", nullable: true })
  topicId?: number;

  @Column({ nullable: true })
  title?: string; // Title of the video

  @Column({ nullable: true })
  description?: string; // Description of the video

  @Column({ nullable: true })
  ordering?: number; // Ordering of the video in the course

  @Column({ name: "is_paid", default: true })
  isPaid?: boolean;

  @Column({ name: "is_reserved", default: false })
  isReserved?: boolean;

  @Column({ nullable: true })
  url?: string; // URL for the session (e.g., Zoom link)

  @Column({ name: "video_url", nullable: true })
  videoUrl?: string; // URL for the recorded session (if applicable)

  @Column({ name: "attachment_urls", type: "json", nullable: true })
  attachmentUrls?: string[]; // Array of document/image URLs

  @Column({ nullable: true })
  status?: string; //  "unreserved" : default status, "unscheduled", "scheduled", "canceled", "completed"

  @ManyToOne(() => CourseModel, (course) => course.sessions)
  course?: CourseModel;

  @OneToMany(
    () => SessionEnrollmentModel,
    (sessionEnrollment) => sessionEnrollment.session
  )
  enrollments?: SessionEnrollmentModel[];

  @OneToMany(() => SessionTimeChangeRequestModel, (request) => request.session)
  sessionTimeChangeRequests?: SessionTimeChangeRequestModel[];

  @OneToMany(() => ComplaintModel, (complaint) => complaint.session)
  complaints?: ComplaintModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
