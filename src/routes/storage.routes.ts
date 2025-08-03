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
router.get(
  "/files/:filename",
  AuthMiddleware.verifyToken,
  storageController.getFileUrl
);

// // Delete file
// router.delete('/files/:id', AuthMiddleware.verifyToken, storageController.deleteFile);

// // Get user files
//router.get('/files', AuthMiddleware.verifyToken, storageController.getUserFiles);

// // Update file metadata
// router.put('/files/:id', AuthMiddleware.verifyToken, storageController.updateFile);

export { router as storageRouter };
