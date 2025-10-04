import { Expose, Transform, Type } from "class-transformer";
import { MaterialDto } from "./material.dto";
import { getVideoThumbnail } from "../utils";

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
  @Transform(({ value }) => (value ? getVideoThumbnail(value) : undefined))
  videoThumbnail?: string;

  @Expose()
  @Type(() => MaterialDto)
  @Transform(({ value }) => (value && value.length > 0 ? value : undefined))
  materials?: MaterialDto[]; // Array of document/image URLs

  @Expose()
  order?: number;
}
