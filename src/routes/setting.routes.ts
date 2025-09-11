import express from "express";
import { SettingController } from "../controllers/setting.controller";
import { ValidationMiddleware } from "../utils/validation.middleware";
import { AuthMiddleware } from "../utils/auth.middleware";
import { settingValidationSchema } from "../validations/settings.validation";

const router = express.Router();

const settingController = new SettingController();

router.put(
  "/",
  AuthMiddleware.verifyToken,
  ValidationMiddleware.validate(settingValidationSchema),
  settingController.createOrUpdateSettings
);

router.get("/", AuthMiddleware.verifyToken, settingController.getSettings);

export { router as settingRouter };
