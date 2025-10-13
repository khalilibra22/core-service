import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { MaterialLinkModel } from "./material-link.model";

@Entity("materials")
export class MaterialModel {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  type?: string;

  @Column({ type: "bigint", nullable: true })
  size?: string;

  @Column({ nullable: true, name: "storage_id" })
  storageId?: string;

  @Index("IDX_materials_uploaded_by")
  @Column({ type: "uuid", nullable: true, name: "uploaded_by" })
  uploadedBy?: string; // userId

  @Index("IDX_materials_teacher_id")
  @Column({ type: "uuid", nullable: true, name: "teacher_id" })
  teacherId?: string;

  @Column({ nullable: true })
  description?: string;

  @OneToMany(() => MaterialLinkModel, (link) => link.material)
  links?: MaterialLinkModel[];

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
