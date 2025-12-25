/**
 * Settings Service
 */

import { settingsRepository } from "@/modules/database";
import type { SystemSettings } from "@/lib/types";

export const settingsService = {
  getSettings(): SystemSettings {
    return settingsRepository.get();
  },

  async getSettingsAsync(): Promise<SystemSettings> {
    return settingsRepository.getAsync();
  },

  updateSettings(data: Partial<SystemSettings>): SystemSettings {
    return settingsRepository.update(data);
  },

  async updateSettingsAsync(data: Partial<SystemSettings>): Promise<SystemSettings> {
    return settingsRepository.updateAsync(data);
  },
};
