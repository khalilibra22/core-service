import { Request, Response } from "express";
import { StorageService } from "../services/storage.service";

export class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file provided" });
        return;
      }

      // Check if the file is an image and reduce resolution if needed
      if (req.file.mimetype.startsWith("image/")) {
        const processedFile = await this.storageService.reduceImageResolution(
          req.file
        );
        const fileUrl = await this.storageService.uploadFile(processedFile);
        res.status(200).json({
          message: "Image uploaded successfully with reduced resolution",
          url: fileUrl,
        });
        return;
      }

      const fileUrl = await this.storageService.uploadFile(req.file);
      res.status(200).json({
        message: "File uploaded successfully",
        url: fileUrl,
      });
    } catch (error) {
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

      await this.storageService.deleteFile(id);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
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
      res.status(500).json({
        error: "Failed to get file URL",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
