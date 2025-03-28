export class Subject {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  teacherId: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: number,
    name: string,
    description: string,
    categoryId: number,
    teacherId: string,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.categoryId = categoryId;
    this.teacherId = teacherId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
