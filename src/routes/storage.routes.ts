import { Router } from "express";
import { StorageController } from "../controllers/storage.controller";
import { upload } from "../config/multer";
import { AuthMiddleware } from "../utils/auth.middleware";

const router = Router();
const storageController = new StorageController();

// Upload file
router.post(
  "/",
  AuthMiddleware.verifyToken,
  upload.single("file"),
  storageController.uploadFile
);

// // Get file by ID
router.get("/:id", AuthMiddleware.verifyToken, storageController.getFileUrl);

// // Delete file
router.delete("/:id", AuthMiddleware.verifyToken, storageController.deleteFile);

export { router as storageRouter };
