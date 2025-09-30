import { AppDataSource } from "../config/database";
import { SettingsModel } from "../models/settings.model";

export class SettingService {
  settingRepo: any;

  constructor() {
    this.settingRepo = AppDataSource.getRepository(SettingsModel);
  }

  async createOrUpdateSettings(
    settings: SettingsModel
  ): Promise<SettingsModel> {
    try {
      return await this.settingRepo.save(settings);
    } catch (error) {
      throw new Error("Error creating or updating settings");
    }
  }

  async getSettingsById(id: number): Promise<SettingsModel | null> {
    try {
      return await this.settingRepo.findOne({
        where: {
          id: id,
        },
        cache: {
          id: `settings-${id}`,
          milliseconds: 600000, // 10 minutes - settings change less frequently
        },
      });
    } catch (error) {
      console.error(error);
      throw new Error("Error fetching settings by ID");
    }
  }
}
