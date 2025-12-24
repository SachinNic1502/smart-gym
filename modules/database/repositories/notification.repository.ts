/**
 * Notification Repository
 */

import { getStore, persistStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { generateId, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Notification, NotificationPreferences, NotificationType, NotificationStatus } from "@/lib/types";

export interface NotificationFilters {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: "low" | "medium" | "high" | "urgent";
  dateFrom?: string;
  dateTo?: string;
}

export const notificationRepository: {
  findAll(filters?: NotificationFilters, pagination?: PaginationOptions): PaginatedResult<Notification>;
  findById(id: string): Notification | undefined;
  create(data: Omit<Notification, "id" | "createdAt">): Notification;
  update(id: string, data: Partial<Notification>): Notification | undefined;
  delete(id: string): boolean;
  markAsRead(id: string): Notification | undefined;
  markAllAsRead(userId: string): Notification[];
  getUnreadCount(userId: string): number;
  findAllAsync(filters?: NotificationFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Notification>>;
  findByIdAsync(id: string): Promise<Notification | undefined>;
  createAsync(data: Omit<Notification, "id" | "createdAt">): Promise<Notification>;
  updateAsync(id: string, data: Partial<Notification>): Promise<Notification | undefined>;
  deleteAsync(id: string): Promise<boolean>;
  markAsReadAsync(id: string): Promise<Notification | undefined>;
  markAllAsReadAsync(userId: string): Promise<Notification[]>;
  getUnreadCountAsync(userId: string): Promise<number>;
} = {
  findAll(filters?: NotificationFilters, pagination?: PaginationOptions): PaginatedResult<Notification> {
    let notifications = [...getStore().notifications];

    if (filters) {
      if (filters.userId) {
        notifications = notifications.filter(n => n.userId === filters.userId);
      }
      if (filters.type) {
        notifications = notifications.filter(n => n.type === filters.type);
      }
      if (filters.status) {
        notifications = notifications.filter(n => n.status === filters.status);
      }
      if (filters.priority) {
        notifications = notifications.filter(n => n.priority === filters.priority);
      }
      if (filters.dateFrom) {
        notifications = notifications.filter(n => n.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        notifications = notifications.filter(n => n.createdAt <= filters.dateTo!);
      }
    }

    // Sort by creation date (newest first)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (pagination) {
      const start = (pagination.page - 1) * pagination.pageSize;
      const end = start + pagination.pageSize;
      const paginatedData = notifications.slice(start, end);

      return {
        data: paginatedData,
        total: notifications.length,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages: Math.ceil(notifications.length / pagination.pageSize),
      };
    }

    return {
      data: notifications,
      total: notifications.length,
      page: 1,
      pageSize: notifications.length,
      totalPages: 1,
    };
  },

  findById(id: string): Notification | undefined {
    return getStore().notifications.find(n => n.id === id);
  },

  create(data: Omit<Notification, "id" | "createdAt">): Notification {
    const notification: Notification = {
      ...data,
      id: generateId("NOT"),
      createdAt: new Date().toISOString(),
      read: data.read ?? false,
    };

    getStore().notifications.unshift(notification);
    persistStore();
    return notification;
  },

  update(id: string, data: Partial<Notification>): Notification | undefined {
    const store = getStore();
    const index = store.notifications.findIndex(n => n.id === id);
    if (index === -1) return undefined;

    store.notifications[index] = { ...store.notifications[index], ...data };
    persistStore();
    return store.notifications[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.notifications.findIndex(n => n.id === id);
    if (index === -1) return false;

    store.notifications.splice(index, 1);
    persistStore();
    return true;
  },

  markAsRead(id: string): Notification | undefined {
    return this.update(id, { status: "read", readAt: new Date().toISOString() });
  },

  markAllAsRead(userId: string): Notification[] {
    const store = getStore();
    const userNotifications = store.notifications.filter(n => n.userId === userId && n.status === "unread");
    const now = new Date().toISOString();

    userNotifications.forEach(notification => {
      notification.status = "read";
      notification.readAt = now;
    });

    persistStore();
    return userNotifications;
  },

  getUnreadCount(userId: string): number {
    return getStore().notifications.filter(n => n.userId === userId && n.status === "unread").length;
  },

  // Async methods (for database operations)
  async findAllAsync(filters?: NotificationFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Notification>> {
    try {
      await connectToDatabase();
      // In a real implementation, you would query the database here
      // For now, fall back to in-memory implementation
      return this.findAll(filters, pagination);
    } catch {
      return this.findAll(filters, pagination);
    }
  },

  async findByIdAsync(id: string): Promise<Notification | undefined> {
    try {
      await connectToDatabase();
      // In a real implementation, you would query the database here
      return this.findById(id);
    } catch {
      return this.findById(id);
    }
  },

  async createAsync(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    try {
      await connectToDatabase();
      // In a real implementation, you would save to the database here
      return this.create(data);
    } catch {
      return this.create(data);
    }
  },

  async updateAsync(id: string, data: Partial<Notification>): Promise<Notification | undefined> {
    try {
      await connectToDatabase();
      // In a real implementation, you would update the database here
      return this.update(id, data);
    } catch {
      return this.update(id, data);
    }
  },

  async deleteAsync(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      // In a real implementation, you would delete from the database here
      return this.delete(id);
    } catch {
      return this.delete(id);
    }
  },

  async markAsReadAsync(id: string): Promise<Notification | undefined> {
    return this.markAsRead(id);
  },

  async markAllAsReadAsync(userId: string): Promise<Notification[]> {
    return this.markAllAsRead(userId);
  },

  async getUnreadCountAsync(userId: string): Promise<number> {
    return this.getUnreadCount(userId);
  },
};
