import { connectToDatabase } from "../mongoose";
import { SettingModel } from "../models";
import { seedSettings } from "../seed-data";
import type { SystemSettings } from "@/lib/types";

export const settingsRepository = {
  /**
   * @deprecated Use getAsync()
   */
  get(): SystemSettings {
    console.warn("settingsRepository.get() is deprecated. Use getAsync().");
    return seedSettings;
  },

  /**
   * @deprecated Use updateAsync()
   */
  update(data: Partial<SystemSettings>): SystemSettings {
    console.warn("settingsRepository.update() is deprecated. Use updateAsync().");
    return { ...seedSettings, ...data };
  },

  // ============================================
  // Mongo-backed async methods
  // ============================================

  async getAsync(): Promise<SystemSettings> {
    await connectToDatabase();
    const settings = await SettingModel.findOne().lean<SystemSettings | null>();

    if (!settings) {
      // If none in DB, return seed data and optionally seed it
      return seedSettings;
    }

    return settings;
  },

  async updateAsync(data: Partial<SystemSettings>): Promise<SystemSettings> {
    await connectToDatabase();

    const updated = await SettingModel.findOneAndUpdate(
      {},
      { ...data },
      { new: true, upsert: true }
    ).lean<SystemSettings | null>();

    return updated as SystemSettings;
  },
};
