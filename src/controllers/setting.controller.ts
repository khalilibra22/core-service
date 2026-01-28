import { Request, Response } from "express";
import { SettingService } from "../services/setting.service";
import { inject, injectable } from "tsyringe";

@injectable()
export class SettingController {
  constructor(
    @inject(SettingService) private settingService: SettingService
  ) { }
  createOrUpdateSettings = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const settings = await this.settingService.getSettingsById(1);
      delete req.body.ownerId;
      let settingsBody = req.body;
      if (settings) {
        settingsBody = { id: 1, ...req.body };
      }
      await this.settingService.createOrUpdateSettings(settingsBody);
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      req.log.error({ err: error }, "createOrUpdateSettings failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };

  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.settingService.getSettingsById(1);
      if (!settings) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }
      delete settings.id;
      res.status(200).json(settings);
    } catch (error) {
      req.log.error({ err: error }, "getSettings failed");
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
