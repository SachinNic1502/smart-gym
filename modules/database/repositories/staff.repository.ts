/**
 * Staff Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { StaffModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Staff, StaffRole } from "@/lib/types";

export interface StaffFilters {
  branchId?: string;
  role?: StaffRole;
  status?: "active" | "inactive";
  search?: string;
}

export const staffRepository = {
  findAll(filters: StaffFilters = {}, pagination?: PaginationOptions): PaginatedResult<Staff> {
    const store = getStore();
    let filtered = [...store.staff];

    if (filters.branchId) {
      filtered = filtered.filter(s => s.branchId === filters.branchId);
    }

    if (filters.role) {
      filtered = filtered.filter(s => s.role === filters.role);
    }

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.phone.includes(search)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return paginate(filtered, pagination);
  },

  findById(id: string): Staff | undefined {
    return getStore().staff.find(s => s.id === id);
  },

  findByEmail(email: string): Staff | undefined {
    return getStore().staff.find(s => s.email.toLowerCase() === email.toLowerCase());
  },

  create(data: Omit<Staff, "id" | "createdAt" | "updatedAt">): Staff {
    const store = getStore();
    const now = formatDate(new Date());
    const staff: Staff = {
      ...data,
      id: generateId("STF"),
      createdAt: now,
      updatedAt: now,
    };
    store.staff.push(staff);
    return staff;
  },

  update(id: string, data: Partial<Staff>): Staff | null {
    const store = getStore();
    const index = store.staff.findIndex(s => s.id === id);
    if (index === -1) return null;

    store.staff[index] = {
      ...store.staff[index],
      ...data,
      id,
      updatedAt: formatDate(new Date()),
    };
    return store.staff[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.staff.findIndex(s => s.id === id);
    if (index === -1) return false;
    store.staff.splice(index, 1);
    return true;
  },

  getCountByBranch(branchId: string): number {
    return getStore().staff.filter(s => s.branchId === branchId && s.status === "active").length;
  },

  getTrainers(branchId?: string): Staff[] {
    const store = getStore();
    return store.staff.filter(s => 
      s.role === "trainer" && 
      s.status === "active" &&
      (!branchId || s.branchId === branchId)
    );
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters: StaffFilters = {}, pagination?: PaginationOptions): Promise<PaginatedResult<Staff>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.role) query.role = filters.role;
    if (filters.status) query.status = filters.status;
    if (filters.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await StaffModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await StaffModel.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Staff[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await StaffModel.find(query).sort({ name: 1 }).lean<Staff[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Staff | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findById(id);
    }
    const doc = await StaffModel.findOne({ id }).lean<Staff | null>();
    return doc ?? undefined;
  },

  async findByEmailAsync(email: string): Promise<Staff | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findByEmail(email);
    }
    const doc = await StaffModel.findOne({ email }).lean<Staff | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Staff, "id" | "createdAt" | "updatedAt">): Promise<Staff> {
    const staff = this.create(data);

    try {
      await connectToDatabase();
      await StaffModel.create(staff);
    } catch {
      // ignore and keep in-memory
    }

    return staff;
  },

  async updateAsync(id: string, data: Partial<Staff>): Promise<Staff | null> {
    const updated = this.update(id, data);

    try {
      await connectToDatabase();
      const doc = await StaffModel.findOneAndUpdate(
        { id },
        { ...data, id, updatedAt: formatDate(new Date()) },
        { new: true },
      ).lean<Staff | null>();
      return doc ?? updated;
    } catch {
      return updated;
    }
  },

  async deleteAsync(id: string): Promise<boolean> {
    const deleted = this.delete(id);
    try {
      await connectToDatabase();
      const res = await StaffModel.deleteOne({ id }).exec();
      return res.deletedCount === 1;
    } catch {
      return deleted;
    }
  },

  async getCountByBranchAsync(branchId: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getCountByBranch(branchId);
    }
    return StaffModel.countDocuments({ branchId, status: "active" }).exec();
  },

  async getTrainersAsync(branchId?: string): Promise<Staff[]> {
    try {
      await connectToDatabase();
    } catch {
      return this.getTrainers(branchId);
    }
    const query: Record<string, unknown> = { role: "trainer", status: "active" };
    if (branchId) query.branchId = branchId;
    return StaffModel.find(query).sort({ name: 1 }).lean<Staff[]>();
  },
};
