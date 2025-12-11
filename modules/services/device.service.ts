/**
 * Device Service
 */

import { branchRepository, deviceRepository, type DeviceFilters, type PaginationOptions, type PaginatedResult } from "@/modules/database";
import type { Device } from "@/lib/types";
import type { DeviceFormData } from "@/lib/validations/auth";

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeviceListResult extends PaginatedResult<Device> {
  stats: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
}

export type CreateDeviceData = DeviceFormData;
export type UpdateDeviceData = DeviceFormData;

async function findBranchById(branchId: string) {
  // Prefer in-memory branch first (seed data), then fall back to Mongo-backed branch
  const inMemory = branchRepository.findById(branchId);
  if (inMemory) return inMemory;

  if (typeof branchRepository.findByIdAsync === "function") {
    return branchRepository.findByIdAsync(branchId);
  }

  return undefined;
}

export const deviceService = {
  /**
   * Get devices with filters, pagination, and stats
   */
  async getDevices(filters?: DeviceFilters, pagination?: PaginationOptions): Promise<DeviceListResult> {
    const result = await deviceRepository.findAllAsync(filters, pagination);
    const stats = deviceRepository.getStats(filters?.branchId);
    return { ...result, stats };
  },

  /**
   * Get a single device by ID
   */
  async getDevice(id: string): Promise<ServiceResult<Device>> {
    const device = await deviceRepository.findByIdAsync(id);
    if (!device) {
      return { success: false, error: "Device not found" };
    }
    return { success: true, data: device };
  },

  /**
   * Create a new device (validated data)
   */
  async createDevice(data: CreateDeviceData): Promise<ServiceResult<Device>> {
    const branch = await findBranchById(data.branchId);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    const allowedStatuses: Device["status"][] = ["online", "offline", "maintenance"];
    const status: Device["status"] =
      data.status && allowedStatuses.includes(data.status)
        ? data.status
        : "online";

    const device = await deviceRepository.createAsync({
      name: data.name.trim(),
      type: data.type,
      status,
      branchId: data.branchId,
      branchName: branch.name,
      lastPing: data.lastPing || new Date().toISOString(),
      firmwareVersion: data.firmwareVersion,
      model: data.model,
      connectionType: data.connectionType,
      ipAddress: data.connectionType === "lan" ? data.ipAddress : undefined,
      cloudUrl: data.connectionType === "cloud" ? data.cloudUrl : undefined,
    });

    return { success: true, data: device };
  },

  /**
   * Update an existing device (validated data)
   */
  async updateDevice(id: string, data: UpdateDeviceData): Promise<ServiceResult<Device>> {
    const existing = await deviceRepository.findByIdAsync(id);
    if (!existing) {
      return { success: false, error: "Device not found" };
    }

    const branch = await findBranchById(data.branchId);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    const allowedStatuses: Device["status"][] = ["online", "offline", "maintenance"];
    const status: Device["status"] =
      data.status && allowedStatuses.includes(data.status)
        ? data.status
        : existing.status ?? "online";

    const updated = await deviceRepository.updateAsync(id, {
      name: data.name.trim(),
      type: data.type,
      status,
      branchId: data.branchId,
      branchName: branch.name,
      firmwareVersion: data.firmwareVersion,
      model: data.model,
      connectionType: data.connectionType,
      ipAddress: data.connectionType === "lan" ? data.ipAddress : undefined,
      cloudUrl: data.connectionType === "cloud" ? data.cloudUrl : undefined,
      lastPing: data.lastPing ?? existing.lastPing,
    });

    if (!updated) {
      return { success: false, error: "Device not found" };
    }

    return { success: true, data: updated };
  },

  /**
   * Delete a device
   */
  async deleteDevice(id: string): Promise<ServiceResult<{ id: string }>> {
    const deleted = await deviceRepository.deleteAsync(id);
    if (!deleted) {
      return { success: false, error: "Device not found" };
    }

    return { success: true, data: { id } };
  },
};
