/**
 * Branch Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { BranchModel, MemberModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Branch } from "@/lib/types";

export interface BranchFilters {
  status?: string;
  search?: string;
}

export const branchRepository = {
  findAll(filters?: BranchFilters, pagination?: PaginationOptions): PaginatedResult<Branch> {
    let branches = [...getStore().branches];

    if (filters) {
      if (filters.status) {
        branches = branches.filter(b => b.status === filters.status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        branches = branches.filter(b =>
          b.name.toLowerCase().includes(search) ||
          b.city.toLowerCase().includes(search) ||
          b.email.toLowerCase().includes(search)
        );
      }
    }

    branches.sort((a, b) => a.name.localeCompare(b.name));

    if (pagination) {
      return paginate(branches, pagination);
    }

    return {
      data: branches,
      total: branches.length,
      page: 1,
      pageSize: branches.length,
      totalPages: 1,
    };
  },

  findById(id: string): Branch | undefined {
    return getStore().branches.find(b => b.id === id);
  },

  findByName(name: string): Branch | undefined {
    return getStore().branches.find(b => b.name.toLowerCase() === name.toLowerCase());
  },

  create(data: Omit<Branch, "id" | "createdAt" | "updatedAt" | "memberCount" | "deviceCount">): Branch {
    const now = formatDate();
    const branch: Branch = {
      ...data,
      id: generateId("BRN"),
      memberCount: 0,
      deviceCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    getStore().branches.push(branch);
    return branch;
  },

  update(id: string, data: Partial<Branch>): Branch | undefined {
    const store = getStore();
    const index = store.branches.findIndex(b => b.id === id);
    if (index === -1) return undefined;

    store.branches[index] = {
      ...store.branches[index],
      ...data,
      id,
      updatedAt: formatDate(),
    };
    return store.branches[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.branches.findIndex(b => b.id === id);
    if (index === -1) return false;
    store.branches.splice(index, 1);
    return true;
  },

  getMemberCount(id: string): number {
    return getStore().members.filter(m => m.branchId === id).length;
  },

  getDeviceCount(id: string): number {
    return getStore().devices.filter(d => d.branchId === id).length;
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters?: BranchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Branch>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const docs = await BranchModel.find(query).sort({ name: 1 }).lean<Branch[]>();

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

  async findByIdAsync(id: string): Promise<Branch | undefined> {
    await connectToDatabase();
    const doc = await BranchModel.findOne({ id }).lean<Branch | null>();
    return doc ?? undefined;
  },

  async findByNameAsync(name: string): Promise<Branch | undefined> {
    await connectToDatabase();
    const doc = await BranchModel.findOne({ name }).lean<Branch | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Branch, "id" | "createdAt" | "updatedAt" | "memberCount" | "deviceCount">): Promise<Branch> {
    await connectToDatabase();
    const now = formatDate();
    const branch: Branch = {
      ...data,
      id: generateId("BRN"),
      memberCount: 0,
      deviceCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await BranchModel.create(branch);
    return branch;
  },

  async updateAsync(id: string, data: Partial<Branch>): Promise<Branch | undefined> {
    await connectToDatabase();
    const updated = await BranchModel.findOneAndUpdate(
      { id },
      { ...data, id, updatedAt: formatDate() },
      { new: true },
    ).lean<Branch | null>();
    return updated ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await BranchModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async getMemberCountAsync(id: string): Promise<number> {
    await connectToDatabase();
    const count = await MemberModel.countDocuments({ branchId: id }).exec();
    return count;
  },
};
