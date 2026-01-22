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
import { SessionModel } from "./session.model";

@Entity("session_time_change_requests")
@Index("IDX_session_time_change_requests_user_id", ["userId"])
@Index("IDX_session_time_change_requests_status", ["status"])
@Index("IDX_session_time_change_requests_requested_time", ["requestedTime"])
@Index("IDX_session_time_change_requests_created_at", ["createdAt"])
@Index("IDX_session_time_change_requests_session_id", ["session"])
@Index("IDX_session_time_change_requests_user_status", ["userId", "status"])
@Index("IDX_session_time_change_requests_status_created", ["status", "createdAt"])
export class SessionTimeChangeRequestModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "timestamp", nullable: true })
  requestedTime?: Date;

  @Column({ nullable: true })
  availabilityId?: string;

  @Column({ default: "pending" })
  status?: string; // Status of the request (e.g., pending, approved, rejected)

  @Column()
  userId?: string;

  @Column({ nullable: true })
  reason?: string;

  @ManyToOne(
    () => SessionModel,
    (session) => session.sessionTimeChangeRequests,
    { cascade: true }
  )
  session?: SessionModel;

  @CreateDateColumn({ type: "timestamp" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt?: Date;

  @DeleteDateColumn({ type: "timestamp" })
  deletedAt?: Date;
}
