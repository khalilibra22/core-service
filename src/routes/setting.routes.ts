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
  async (req, res) => await settingController.createOrUpdateSettings(req, res)
);

router.get(
  "/",
  AuthMiddleware.verifyToken,
  async (req, res) => await settingController.getSettings(req, res)
);

export { router as settingRouter };
