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
import { ParticipantModel } from "./participant.model";
import { SessionTimeChangeRequestModel } from "./sessionTimeChangeRequest.model";

@Entity("sessions")
export class SessionModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "timestamp", nullable: true })
  date?: Date;

  @Column({ nullable: true })
  duration?: string;

  @Column({ name: "topic_id" })
  topicId?: string;

  @Column({ nullable: true })
  title?: string; // Title of the video

  @Column({ nullable: true })
  description?: string; // Description of the video

  @Column({ nullable: true })
  ordering?: number; // Ordering of the video in the course

  @Column({ name: "is_paid", default: true })
  isPaid?: boolean;

  @Column({ nullable: true })
  url?: string; // URL for the session (e.g., Zoom link)

  @Column({ name: "video_url", nullable: true })
  videoUrl?: string; // URL for the recorded session (if applicable)

  @Column({ nullable: true })
  status?: string; // "unscheduled" : default status , "scheduled", "canceled", "completed"

  @ManyToOne(() => CourseModel, (course) => course.sessions)
  course?: CourseModel;

  @OneToMany(() => ParticipantModel, (participant) => participant.session)
  participants?: ParticipantModel[];

  @OneToMany(() => SessionTimeChangeRequestModel, (request) => request.session)
  sessionTimeChangeRequests?: SessionTimeChangeRequestModel[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
