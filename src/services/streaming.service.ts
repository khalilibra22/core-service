import crypto from "crypto";
import axios from "axios";
import { logger } from "../utils/logger";

export class StreamingService {
  private bunnyApiUrl: string;
  private bunnySecret: string;
  private libraryId: string;
  private iframeUrl: string;
  private cdnUrl: string;

  constructor() {
    this.bunnyApiUrl =
      process.env.BUNNY_API_URL || "https://video.bunnycdn.com";
    this.bunnySecret =
      process.env.BUNNY_API_KEY || "84f8b64c-4da3-4817-b75586c5975f-2179-472a";
    this.libraryId = process.env.BUNNY_LIBRARY_ID || "478957"; // must be numeric
    this.iframeUrl =
      process.env.BUNNY_IFRAME_URL ||
      `https://iframe.mediadelivery.net/embed/${this.libraryId}`;
    this.cdnUrl =
      process.env.BUNNY_CDN_URL || "https://vz-9344fef6-fe5.b-cdn.net";
  }

  async createVideoEntry(title: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.bunnyApiUrl}/library/${this.libraryId}/videos`,
        { title },
        { headers: { AccessKey: this.bunnySecret } }
      );
      const videoId = response.data.guid;
      const presignedHeaders = this.generatePresignedUploadHeaders(videoId);
      return presignedHeaders;
    } catch (error) {
      logger.error({ err: error, title }, "createVideoEntry failed");
      throw new Error(`Failed to create video entry: ${error}`);
    }
  }

  async getVideoById(videoId: string): Promise<string> {
    try {
      const response = await axios.get(
        `${this.bunnyApiUrl}/library/${this.libraryId}/videos/${videoId}`,
        { headers: { AccessKey: this.bunnySecret } }
      );

      return `${this.cdnUrl}/${videoId}/playlist.m3u8`;
    } catch (error: any) {
      logger.error({ err: error, videoId }, "getVideoById failed");
      if (error.response && error.response.status === 404) {
        throw new Error("Video not found");
      }
      throw new Error(`Failed to get video by ID: ${error}`);
    }
  }

  async deleteVideoById(videoId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.bunnyApiUrl}/library/${this.libraryId}/videos/${videoId}`,
        { headers: { AccessKey: this.bunnySecret } }
      );
    } catch (error: any) {
      logger.error({ err: error, videoId }, "deleteVideoById failed");
      if (error.response && error.response.status === 404) {
        throw new Error("Video not found");
      }
      throw new Error(`Failed to delete video by ID: ${error}`);
    }
  }

  private generatePresignedUploadHeaders(videoId: string): any {
    try {
      const expiration = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const sha256 = (data: string) =>
        crypto.createHash("sha256").update(data).digest("hex");

      const signature = sha256(
        this.libraryId + this.bunnySecret + expiration + videoId
      );

      return {
        AuthorizationSignature: signature,
        AuthorizationExpire: expiration.toString(),
        LibraryId: this.libraryId,
        VideoId: videoId,
      };
    } catch (error: any) {
      logger.error({ err: error, videoId }, "generatePresignedUploadHeaders failed");
      throw new Error(`Failed to generate presigned upload headers: ${error}`);
    }
  }
}
