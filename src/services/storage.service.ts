import { S3 } from "aws-sdk";
import { v4 as uuidv4 } from "uuid";

export class StorageService {
  private s3: S3;
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
    this.s3 = new S3({
      endpoint: this.endpoint,
      accessKeyId: "vrpqFtqOXks6WL8rXWuF",
      secretAccessKey: "F3tmmfuLa7nV4eAoIA7mAeIJMXm5owDyFCtp3wFC",
      s3ForcePathStyle: true,
      signatureVersion: "v4",
    });

    this.bucketName = process.env.WASABI_BUCKET_NAME || "assetss"; // Default bucket name if not set in environment variables
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `${uuidv4()}-${file.originalname
      .toLowerCase()
      .replace(/\s+/g, "-")}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: "public-read",
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.split("/").pop();

    const params = {
      Bucket: this.bucketName,
      Key: key!,
    };

    await this.s3.deleteObject(params).promise();
  }

  async getFileUrl(fileName: string): Promise<string> {
    return `${this.endpoint}/${this.bucketName}/${fileName}`;
  }
}
