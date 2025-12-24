import { getStore, persistStore } from "../store";
import { generateId, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";

export interface CommunicationFilters {
  channel?: MessageChannel;
  status?: "sent" | "scheduled" | "draft";
}

export const communicationRepository = {
  findAll(filters: CommunicationFilters = {}, pagination?: PaginationOptions): PaginatedResult<BroadcastMessage> {
    const store = getStore();
    let filtered = [...store.communications];

    if (filters.channel) {
      filtered = filtered.filter(c => c.channel === filters.channel);
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

    return paginate(filtered, pagination);
  },

  findById(id: string): BroadcastMessage | undefined {
    return getStore().communications.find(c => c.id === id);
  },

  create(data: Omit<BroadcastMessage, "id">): BroadcastMessage {
    const store = getStore();
    const message: BroadcastMessage = {
      ...data,
      id: generateId("MSG"),
    };
    store.communications.unshift(message);
    persistStore();
    return message;
  },

  update(id: string, data: Partial<BroadcastMessage>): BroadcastMessage | null {
    const store = getStore();
    const index = store.communications.findIndex(c => c.id === id);
    if (index === -1) return null;

    store.communications[index] = {
      ...store.communications[index],
      ...data,
      id,
    };
    persistStore();
    return store.communications[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.communications.findIndex(c => c.id === id);
    if (index === -1) return false;
    store.communications.splice(index, 1);
    persistStore();
    return true;
  },
};
