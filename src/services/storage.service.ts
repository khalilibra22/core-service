import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { MaterialModel } from "../models/material.model";
import { AppDataSource } from "../config/database";

export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private endpoint: string;
  private materialRepo: any;

  constructor() {
    this.endpoint =
      process.env.S3_ENDPOINT || "https://s3.eu-central-2.wasabisys.com";
    this.s3 = new S3Client({
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "GSQE53P3LXBXHDHYDAPV",
        secretAccessKey:
          process.env.S3_SECRET_ACCESS_KEY ||
          "wTiv7aijVH9zsKFKBplIigVS8vUJhH29Yc6SdCTs",
      },
      forcePathStyle: true,
      region: process.env.S3_REGION || "us-east-1",
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "courses-dev-assets"; // Default bucket name if not set in environment variables
    this.materialRepo = AppDataSource.getRepository(MaterialModel);
  }

  async uploadFile(
    file: Express.Multer.File,
    options?: { ownerId?: string }
  ): Promise<MaterialModel> {
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
      console.log(options?.ownerId);
      const material = await this.materialRepo.save({
        title: file.originalname,
        type: file.mimetype,
        size: file.size,
        storageId: key,
        teacherId: options?.ownerId,
      });
      return material;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async getMaterialById(materialId: string): Promise<MaterialModel | null> {
    try {
      return await this.materialRepo.findOne({
        where: { id: materialId },
      });
    } catch (error) {
      throw new Error(`Failed to get material: ${error}`);
    }
  }

  getPermanentUrl(storageId: string): string {
    // Generate permanent URL for public-read files
    return `${this.endpoint}/${this.bucketName}/${storageId}`;
  }

  async deleteFile(materialId: string): Promise<void> {
    try {
      // Find the material record
      const material = await this.materialRepo.findOne({
        where: { id: materialId },
      });

      if (!material) {
        throw new Error("Material not found");
      }

      // Delete from S3 if storageId exists
      if (material.storageId) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: material.storageId,
        });
        await this.s3.send(command);
      }

      // Soft delete from database
      await this.materialRepo.softDelete(materialId);
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
      // Get image metadata to check current dimensions
      const metadata = await sharp(file.buffer).metadata();
      const { width, height } = metadata;

      if (!width || !height) {
        throw new Error("Could not read image dimensions");
      }

      // Define maximum dimensions (you can adjust these values)
      const maxWidth = 1920; // Full HD width
      const maxHeight = 1080; // Full HD height
      const quality = 80; // JPEG quality (0-100)

      // Calculate new dimensions while maintaining aspect ratio
      let newWidth = width;
      let newHeight = height;

      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          // Landscape image
          newWidth = Math.min(width, maxWidth);
          newHeight = Math.round(newWidth / aspectRatio);

          // If height is still too large, adjust again
          if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = Math.round(newHeight * aspectRatio);
          }
        } else {
          // Portrait or square image
          newHeight = Math.min(height, maxHeight);
          newWidth = Math.round(newHeight * aspectRatio);

          // If width is still too large, adjust again
          if (newWidth > maxWidth) {
            newWidth = maxWidth;
            newHeight = Math.round(newWidth / aspectRatio);
          }
        }
      }

      // Only process if dimensions need to be reduced or if it's not already JPEG
      const needsProcessing =
        newWidth < width ||
        newHeight < height ||
        !file.mimetype.includes("jpeg");

      if (!needsProcessing) {
        // Return original file if no processing needed
        return file;
      }

      // Process the image with Sharp
      const processedBuffer = await sharp(file.buffer)
        .resize(newWidth, newHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({
          quality: quality,
          progressive: true,
          mozjpeg: true, // Use mozjpeg encoder for better compression
        })
        .toBuffer();

      // Check if processed size is actually smaller, otherwise use original
      const finalBuffer =
        processedBuffer.length < file.buffer.length
          ? processedBuffer
          : file.buffer;

      return {
        ...file,
        buffer: finalBuffer,
        size: finalBuffer.length,
        mimetype: "image/jpeg", // Always convert to JPEG for consistency
      };
    } catch (error) {
      throw new Error(`Failed to reduce image resolution: ${error}`);
    }
  }
}
