import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    //this.bucketName = process.env.WASABI_BUCKET_NAME || "your-bucket-name";

    // this.s3 = new AWS.S3({
    //   endpoint: "https://s3.wasabisys.com",
    //   accessKeyId: process.env.WASABI_ACCESS_KEY,
    //   secretAccessKey: process.env.WASABI_SECRET_KEY,
    //   region: "us-east-1", // Wasabi default region
    //   s3ForcePathStyle: true,
    // });
    this.endpoint = "http://localhost:9000";
    this.s3 = new S3Client({
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: "vrpqFtqOXks6WL8rXWuF",
        secretAccessKey: "F3tmmfuLa7nV4eAoIA7mAeIJMXm5owDyFCtp3wFC",
      },
      forcePathStyle: true,
      region: "us-east-1",
    });

    this.bucketName = process.env.WASABI_BUCKET_NAME || "assetss"; // Default bucket name if not set in environment variables
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    try {
      const key = `${uuidv4()}-${file.originalname
        .toLowerCase()
        .replace(/\s+/g, "-")}`;

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read", // or omit for private access
      });

      await this.s3.send(command);
      return key;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = fileUrl.split("/").pop();

      if (!key) {
        throw new Error("File key is required for deletion");
      }
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key!,
      });
      await this.s3.send(command);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error}`);
    }
  }

  async fileExists(fileName: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3.send(command);
      return true;
    } catch (error: any) {
      if (
        error.name === "NoSuchKey" ||
        error.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }
      throw new Error(`Failed to check if file exists: ${error}`);
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      return getSignedUrl(this.s3, command, { expiresIn: 60 * 5 }); // 5 minutes
    } catch (error) {
      throw new Error(`Failed to get file URL: ${error}`);
    }
  }

  async reduceImageResolution(file: Express.Multer.File) {
    if (!file.mimetype.startsWith("image/")) {
      throw new Error("File is not an image");
    }

    try {
      const reducedBuffer = await sharp(file.buffer)
        .jpeg({ quality: 70 })
        .toBuffer();

      // Check if reduced size is actually smaller, otherwise use original
      const finalBuffer =
        reducedBuffer.length < file.buffer.length ? reducedBuffer : file.buffer;

      return {
        ...file,
        buffer: finalBuffer,
        size: finalBuffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to reduce image resolution: ${error}`);
    }
  }
}
