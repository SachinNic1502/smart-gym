import { getStore, persistStore } from "../store";
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
  findAll(filters?: DeviceFilters, pagination?: PaginationOptions): PaginatedResult<Device> {
    let devices = [...getStore().devices];

    if (filters) {
      if (filters.branchId) {
        devices = devices.filter(d => d.branchId === filters.branchId);
      }
      if (filters.status) {
        devices = devices.filter(d => d.status === filters.status);
      }
      if (filters.type) {
        devices = devices.filter(d => d.type === filters.type);
      }
    }

    // Sort: online first, then by name
    devices.sort((a, b) => {
      if (a.status === "online" && b.status !== "online") return -1;
      if (a.status !== "online" && b.status === "online") return 1;
      return a.name.localeCompare(b.name);
    });

    if (pagination) {
      return paginate(devices, pagination);
    }

    return {
      data: devices,
      total: devices.length,
      page: 1,
      pageSize: devices.length,
      totalPages: 1,
    };
  },

  findById(id: string): Device | undefined {
    return getStore().devices.find(d => d.id === id);
  },

  getStats(branchId?: string) {
    const devices = branchId
      ? getStore().devices.filter(d => d.branchId === branchId)
      : getStore().devices;

    return {
      total: devices.length,
      online: devices.filter(d => d.status === "online").length,
      offline: devices.filter(d => d.status === "offline").length,
      maintenance: devices.filter(d => d.status === "maintenance").length,
    };
  },

  async getStatsAsync(branchId?: string) {
    try {
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
    } catch {
      return this.getStats(branchId);
    }
  },

  create(data: Omit<Device, "id" | "createdAt">): Device {
    const store = getStore();
    const device: Device = {
      ...data,
      id: generateId("DEV"),
      createdAt: formatDate(),
    };
    store.devices.push(device);
    persistStore();
    return device;
  },

  update(id: string, data: Partial<Device>): Device | undefined {
    const store = getStore();
    const index = store.devices.findIndex(d => d.id === id);
    if (index === -1) return undefined;

    store.devices[index] = {
      ...store.devices[index],
      ...data,
      id,
    };
    persistStore();
    return store.devices[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.devices.findIndex(d => d.id === id);
    if (index === -1) return false;
    store.devices.splice(index, 1);
    persistStore();
    return true;
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters?: DeviceFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Device>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

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
    try {
      await connectToDatabase();
    } catch {
      return this.findById(id);
    }
    const doc = await DeviceModel.findOne({ id }).lean<Device | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Device, "id" | "createdAt">): Promise<Device> {
    const device = this.create(data);
    try {
      await connectToDatabase();
      await DeviceModel.create(device);
    } catch {
      // ignore and keep in-memory/disk
    }
    return device;
  },

  async updateAsync(id: string, data: Partial<Device>): Promise<Device | undefined> {
    const updated = this.update(id, data);
    try {
      await connectToDatabase();
      const persisted = await DeviceModel.findOneAndUpdate(
        { id },
        { ...data },
        { new: true },
      ).lean<Device | null>();
      return persisted ?? updated ?? undefined;
    } catch {
      return updated;
    }
  },

  async deleteAsync(id: string): Promise<boolean> {
    const deleted = this.delete(id);
    try {
      await connectToDatabase();
      await DeviceModel.deleteOne({ id }).exec();
    } catch {
      // ignore
    }
    return deleted;
  },
};
