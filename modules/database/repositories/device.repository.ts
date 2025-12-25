/**
 * Device Repository
 */

import { connectToDatabase } from "../mongoose";
import { DeviceModel } from "../models";
import { paginate, type PaginationOptions, type PaginatedResult, generateId, formatDate } from "./base.repository";
import type { Device } from "@/lib/types";

export interface DeviceFilters {
  branchId?: string;
  status?: string;
  type?: string;
}

export const deviceRepository = {
  async findAllAsync(filters?: DeviceFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Device>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) {
      query.branchId = filters.branchId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.type) {
      query.type = filters.type;
    }

    const docs = await DeviceModel.find(query).sort({ name: 1 }).lean<Device[]>();

    if (pagination) {
      return paginate(docs, pagination);
    }

    return {
      data: docs,
      total: docs.length,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Device | undefined> {
    await connectToDatabase();
    const doc = await DeviceModel.findOne({ id }).lean<Device | null>();
    return doc ?? undefined;
  },

  async getStatsAsync(branchId?: string) {
    await connectToDatabase();

    const baseQuery: Record<string, unknown> = {};
    if (branchId) baseQuery.branchId = branchId;

    const [total, online, offline, maintenance] = await Promise.all([
      DeviceModel.countDocuments(baseQuery).exec(),
      DeviceModel.countDocuments({ ...baseQuery, status: "online" }).exec(),
      DeviceModel.countDocuments({ ...baseQuery, status: "offline" }).exec(),
      DeviceModel.countDocuments({ ...baseQuery, status: "maintenance" }).exec(),
    ]);

    return { total, online, offline, maintenance };
  },

  async createAsync(data: Omit<Device, "id" | "createdAt">): Promise<Device> {
    await connectToDatabase();
    const device: Device = {
      ...data,
      id: generateId("DEV"),
      createdAt: formatDate(),
    };
    await DeviceModel.create(device);
    return device;
  },

  async updateAsync(id: string, data: Partial<Device>): Promise<Device | undefined> {
    await connectToDatabase();
    const persisted = await DeviceModel.findOneAndUpdate(
      { id },
      { ...data },
      { new: true },
    ).lean<Device | null>();
    return persisted ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await DeviceModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },
};
