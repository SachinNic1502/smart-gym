/**
 * Settings Service
 */

import { settingsRepository } from "@/modules/database";
import type { SystemSettings } from "@/lib/types";

export const settingsService = {
  getSettings(): SystemSettings {
    return settingsRepository.get();
  },

  updateSettings(data: Partial<SystemSettings>): SystemSettings {
    return settingsRepository.update(data);
  },
};
