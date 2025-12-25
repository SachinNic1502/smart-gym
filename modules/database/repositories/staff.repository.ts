/**
 * Staff Repository
 */

import { connectToDatabase } from "../mongoose";
import { StaffModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Staff } from "@/lib/types";

export interface StaffFilters {
  branchId?: string;
  role?: string;
  status?: string;
}

export const staffRepository = {
  async findAllAsync(filters?: StaffFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Staff>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.role) query.role = filters.role;
    if (filters?.status) query.status = filters.status;

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
    await connectToDatabase();
    const doc = await StaffModel.findOne({ id }).lean<Staff | null>();
    return doc ?? undefined;
  },

  async findByEmailAsync(email: string): Promise<Staff | undefined> {
    await connectToDatabase();
    const doc = await StaffModel.findOne({ email }).lean<Staff | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Staff, "id" | "createdAt" | "updatedAt">): Promise<Staff> {
    await connectToDatabase();
    const now = formatDate();
    const staff: Staff = {
      ...data,
      id: generateId("STF"),
      createdAt: now,
      updatedAt: now,
    };
    await StaffModel.create(staff);
    return staff;
  },

  async updateAsync(id: string, data: Partial<Staff>): Promise<Staff | undefined> {
    await connectToDatabase();
    const doc = await StaffModel.findOneAndUpdate(
      { id },
      { ...data, updatedAt: formatDate() },
      { new: true }
    ).lean<Staff | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await StaffModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },
};
