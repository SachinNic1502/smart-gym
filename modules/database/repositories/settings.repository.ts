import { getStore, persistStore } from "../store";
import type { SystemSettings } from "@/lib/types";

export const settingsRepository = {
  get(): SystemSettings {
    return getStore().settings;
  },

  update(data: Partial<SystemSettings>): SystemSettings {
    const store = getStore();
    store.settings = { ...store.settings, ...data };
    persistStore();
    return store.settings;
  },
};
