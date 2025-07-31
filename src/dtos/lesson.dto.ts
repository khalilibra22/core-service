import { Expose, Transform } from "class-transformer";

export class LessonDto {
  @Expose()
  id?: string;

  @Expose()
  type?: string;

  @Expose()
  title?: string;

  @Expose()
  description?: string;

  @Expose()
  @Transform(({ value }) => (value ? value : undefined))
  videoUrl?: string; // URL for video, file path for documents

  @Expose()
  @Transform(({ value }) => (value ? value : undefined))
  attachmentUrls?: string[]; // Array of document/image URLs
}
