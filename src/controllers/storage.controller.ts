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
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({ error: "Filename is required" });
        return;
      }

      await this.storageService.deleteFile(filename);
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
      const { filename } = req.params;

      if (!filename) {
        res.status(400).json({ error: "Filename is required" });
        return;
      }

      const fileUrl = await this.storageService.getFileUrl(filename);
      res.status(200).json({ url: fileUrl });
    } catch (error) {
      res.status(500).json({
        error: "Failed to get file URL",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };
}
