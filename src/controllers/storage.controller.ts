import { Request, Response } from "express";
import { StorageService } from "../services/storage.service";
import { plainToInstance } from "class-transformer";
import { MinimalMaterialDto } from "../dtos/minimal-material.dto";
import { v4 as uuidv4 } from "uuid";

export class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "No file provided",
          message:
            "Please ensure you're sending a file with the field name 'file' in your multipart form data",
        });
        return;
      }

      // Check if the file is an image and reduce resolution if needed
      let file = req.file;
      if (file.mimetype.startsWith("image/")) {
        file = await this.storageService.reduceImageResolution(file);
      }

      const material = await this.storageService.uploadFile(file, {
        ownerId: req.body.ownerId ?? res.locals.ownerId,
      });
      const materialDto = plainToInstance(MinimalMaterialDto, material, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(materialDto);
    } catch (error) {
      req.log.error({ err: error }, "uploadFile failed");
      res.status(500).json({
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  deleteFile = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "File ID is required" });
        return;
      }

      // Get material to check ownership
      const material = await this.storageService.getMaterialById(id);
      if (!material) {
        res.status(404).json({ error: "Material not found" });
        return;
      }

      // Check if user is the owner (teacherId or uploadedBy)
      const userId = req.body.ownerId;
      // console.log(material.teacherId, material.uploadedBy, userId);
      // if (material.teacherId !== userId && material.uploadedBy !== userId) {
      //   res.status(403).json({ error: "You are not authorized to delete this file" });
      //   return;
      // }

      await this.storageService.deleteFile(id);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "deleteFile failed");
      res.status(500).json({
        error: "Failed to delete file",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getFileUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ error: "File ID is required" });
        return;
      }

      if (!(await this.storageService.fileExists(id))) {
        res.status(404).json({ error: "File not found" });
        return;
      }

      const fileUrl = await this.storageService.getFileUrl(id);
      if (!fileUrl) {
        res.status(404).json({ error: "File not found" });
        return;
      }
      res.status(200).json({ url: fileUrl });
    } catch (error) {
      req.log.error({ err: error, id: req.params.id }, "getFileUrl failed");
      res.status(500).json({
        error: "Failed to get file URL",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  getMaterialsByTeacher = async (req: Request, res: Response): Promise<void> => {
    try {
      const teacherId =
        req.body.ownerId ||
        (res.locals as any)?.ownerId;

      if (!teacherId) {
        res.status(400).json({ error: "Teacher ID is required" });
        return;
      }

      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

      const materials = await this.storageService.getMaterialsByTeacher(
        teacherId,
        page,
        limit
      );

      const materialDtos = plainToInstance(MinimalMaterialDto, materials, {
        excludeExtraneousValues: true,
      });

      res.status(200).json(materialDtos);
    } catch (error) {
      req.log.error({ err: error, teacherId: req.body?.ownerId || (res.locals as any)?.ownerId }, "getMaterialsByTeacher failed");
      res.status(500).json({
        error: "Failed to get materials by teacher",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  generatePresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title } = req.body;
      const key = `${uuidv4()}-${title
        .toLowerCase()
        .replace(/\s+/g, "-")}`;
      const url = await this.storageService.generatePresignedUploadUrl(key,req.body.type);
      // store metadata in database
      const material = {
        ...req.body,
        storageId: key,
      };
      const storedMaterial = await this.storageService.storeUploadMetadata(material);
      const materialDto = plainToInstance(MinimalMaterialDto, storedMaterial, {
        excludeExtraneousValues: true,
      });
      res.status(200).json({ uploadUrl: url, material: materialDto });
    } catch (error) {
      req.log.error({ err: error, title: req.body?.title }, "generatePresignedUploadUrl failed");
      res.status(500).json({
        error: "Failed to generate presigned upload URL",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
