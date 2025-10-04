import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from "typeorm";
import { SessionModel } from "./session.model";
import { MaterialModel } from "./material.model";

@Entity("lessons")
export class LessonModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ type: "varchar", length: 255 })
  title?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "int", default: 0 })
  order?: number;

  @Column({
    type: "enum",
    enum: ["video", "documents"],
  })
  type?: "video" | "documents";

  @Column({ type: "text", nullable: true })
  videoUrl?: string; // URL for video, file path for documents

  // @Column({ type: "json", nullable: true })
  // attachmentUrls?: string[]; // Array of document/image URLs

  @ManyToOne(() => SessionModel, (session) => session.lessons, {
    onDelete: "CASCADE",
  })
  session?: SessionModel;

  @OneToMany(() => MaterialModel, (material) => material.lesson, {
    cascade: true,
  })
  materials?: MaterialModel[];

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp",
  })
  createdAt?: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp",
  })
  updatedAt?: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt?: Date;
}
