/**
 * Branch Service
 */

import { branchRepository, memberRepository, deviceRepository } from "@/modules/database";
import type { Branch } from "@/lib/types";
import type { BranchFilters, PaginationOptions, PaginatedResult } from "@/modules/database";

export interface CreateBranchData {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface BranchWithStats extends Branch {
  stats: {
    totalMembers: number;
    activeMembers: number;
    expiredMembers: number;
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
  };
}

export const branchService = {
  /**
   * Get all branches with filters and pagination
   */
  async getBranches(filters?: BranchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Branch>> {
    return branchRepository.findAllAsync(filters, pagination);
  },

  /**
   * Get a single branch by ID with stats
   */
  async getBranch(id: string): Promise<ServiceResult<BranchWithStats>> {
    const branch = await branchRepository.findByIdAsync(id);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    const members = await memberRepository.findByBranchAsync(id);
    const deviceStats = deviceRepository.getStats(id);
    const activeMembers = members.filter(m => m.status === "Active").length;
    const expiredMembers = members.filter(m => m.status === "Expired").length;

    return {
      success: true,
      data: {
        ...branch,
        stats: {
          totalMembers: members.length,
          activeMembers,
          expiredMembers,
          totalDevices: deviceStats.total,
          onlineDevices: deviceStats.online,
          offlineDevices: deviceStats.offline,
        },
      },
    };
  },

  /**
   * Create a new branch
   */
  async createBranch(data: CreateBranchData): Promise<ServiceResult<Branch>> {
    // Check for duplicate name
    const existingName = await branchRepository.findByNameAsync(data.name);
    if (existingName) {
      return { success: false, error: "A branch with this name already exists" };
    }

    const branch = await branchRepository.createAsync({
      ...data,
      status: "active",
    });

    return { success: true, data: branch };
  },

  /**
   * Update a branch
   */
  async updateBranch(id: string, data: Partial<Branch>): Promise<ServiceResult<Branch>> {
    // Check for duplicate name if name is being changed
    if (data.name) {
      const existing = await branchRepository.findByNameAsync(data.name);
      if (existing && existing.id !== id) {
        return { success: false, error: "A branch with this name already exists" };
      }
    }

    const branch = await branchRepository.updateAsync(id, data);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    return { success: true, data: branch };
  },

  /**
   * Delete a branch
   */
  async deleteBranch(id: string): Promise<ServiceResult<{ id: string }>> {
    // Check if branch has members
    const memberCount = await branchRepository.getMemberCountAsync(id);
    if (memberCount > 0) {
      return {
        success: false,
        error: `Cannot delete branch with ${memberCount} members. Transfer or remove members first.`,
      };
    }

    const deleted = await branchRepository.deleteAsync(id);
    if (!deleted) {
      return { success: false, error: "Branch not found" };
    }

    return { success: true, data: { id } };
  },

  /**
   * Get branch members
   */
  async getBranchMembers(branchId: string, pagination?: PaginationOptions) {
    const branch = await branchRepository.findByIdAsync(branchId);
    if (!branch) {
      return { success: false, error: "Branch not found" };
    }

    const result = await memberRepository.findAllAsync({ branchId }, pagination);

    return {
      success: true,
      data: {
        branch: { id: branch.id, name: branch.name },
        ...result,
      },
    };
  },
};
