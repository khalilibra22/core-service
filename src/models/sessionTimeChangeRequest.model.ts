import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { SessionModel } from "./session.model";

@Entity("session_time_change_requests")
export class SessionTimeChangeRequestModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "timestamp", nullable: true })
  requestedTime?: Date;

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
