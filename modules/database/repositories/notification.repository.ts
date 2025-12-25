/**
 * Notification Repository
 */

import { connectToDatabase } from "../mongoose";
import { NotificationModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Notification } from "@/lib/types";

export interface NotificationFilters {
  userId?: string;
  status?: string;
  branchId?: string;
}

export const notificationRepository = {
  async findAllAsync(filters?: NotificationFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Notification>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.status) query.status = filters.status;
    if (filters?.branchId) query.branchId = filters.branchId;

    const total = await NotificationModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await NotificationModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Notification[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await NotificationModel.find(query).sort({ createdAt: -1 }).lean<Notification[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async createAsync(data: Omit<Notification, "id" | "createdAt">): Promise<Notification> {
    await connectToDatabase();
    const notification: Notification = {
      ...data,
      id: generateId("NOT"),
      createdAt: formatDate(),
    };
    await NotificationModel.create(notification);
    return notification;
  },

  async findByIdAsync(id: string): Promise<Notification | null> {
    await connectToDatabase();
    return await NotificationModel.findOne({ id }).lean<Notification>();
  },

  async updateAsync(id: string, data: Partial<Notification>): Promise<Notification | null> {
    await connectToDatabase();
    const updated = await NotificationModel.findOneAndUpdate(
      { id },
      { $set: data },
      { new: true }
    ).lean<Notification>();
    return updated;
  },

  async markAsReadAsync(id: string): Promise<void> {
    await connectToDatabase();
    await NotificationModel.updateOne(
      { id },
      { $set: { read: true, status: "read", readAt: formatDate() } }
    ).exec();
  },

  async markAllAsReadAsync(userId: string): Promise<void> {
    await connectToDatabase();
    await NotificationModel.updateMany(
      { userId, read: false },
      { $set: { read: true, status: "read", readAt: formatDate() } }
    ).exec();
  },

  async deleteAsync(id: string): Promise<void> {
    await connectToDatabase();
    await NotificationModel.deleteOne({ id }).exec();
  },

  async getUnreadCountAsync(userId: string): Promise<number> {
    await connectToDatabase();
    return await NotificationModel.countDocuments({ userId, read: false }).exec();
  },
};
