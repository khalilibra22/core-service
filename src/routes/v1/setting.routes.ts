import express from "express";
import { SettingController } from "../../controllers/setting.controller";
import { ValidationMiddleware } from "../../utils/validation.middleware";
import { AuthMiddleware } from "../../utils/auth.middleware";
import { settingValidationSchema } from "../../validations/settings.validation";
import { container } from "tsyringe";

const router = express.Router();

const settingController = container.resolve(SettingController);

router.put(
  "/",
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize("settings", "manage"),
  ValidationMiddleware.validate(settingValidationSchema),
  settingController.createOrUpdateSettings
);

router.get("/", AuthMiddleware.verifyToken, settingController.getSettings);

export { router as settingRouter };
