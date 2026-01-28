import { AppDataSource } from "../config/database";
import { logger } from "../utils/logger";
import { SettingsModel } from "../models/settings.model";
import { inject, injectable } from "tsyringe";
import { Repository } from "typeorm";

@injectable()
export class SettingService {

  constructor(@inject("SettingRepository") private settingRepo: Repository<SettingsModel>,
  ) {
  }

  async createOrUpdateSettings(
    settings: SettingsModel
  ): Promise<SettingsModel> {
    try {
      return await this.settingRepo.save(settings);
    } catch (error) {
      logger.error({ err: error }, "createOrUpdateSettings failed");
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
      logger.error({ err: error, id }, "getSettingsById failed");
      throw new Error("Error fetching settings by ID");
    }
  }
}
