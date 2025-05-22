import { Request, Response } from "express";
import { SettingService } from "../services/setting.service";

export class SettingController {
  private settingService: SettingService;
  constructor() {
    this.settingService = new SettingService();
  }
  async createOrUpdateSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.settingService.getSettingsById(1);
      let settingsBody = req.body;
      if (settings) {
        settingsBody = { id: 1, ...req.body };
      }
      await this.settingService.createOrUpdateSettings(settingsBody);
      res.status(200).json({ message: "Settings updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this.settingService.getSettingsById(1);
      if (!settings) {
        res.status(404).json({ error: "Settings not found" });
        return;
      }
      delete settings.id;
      res.status(200).json(settings);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
}
