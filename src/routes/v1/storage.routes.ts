import { Router, Request, Response, NextFunction } from "express";
import { StorageController } from "../../controllers/storage.controller";
import { upload } from "../../config/multer";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { handleMulterError } from "../../utils";

const router = Router();
const storageController = new StorageController();


// Upload file
router.post(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "upload_materials"),
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: any) => {
      if (err) {
        return handleMulterError(err, req, res, next);
      }
      next();
    });
  },
  storageController.uploadFile
);

// // Get file by ID
router.get(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "download_materials"),
  storageController.getFileUrl
);

// Delete file
router.delete(
  "/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "delete_materials"),
  storageController.deleteFile
);

// Get materials by teacher
router.get(
  "/teacher/:teacherId?",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("sessions", "download_materials"),
  storageController.getMaterialsByTeacher
);

export { router as storageRouter };
