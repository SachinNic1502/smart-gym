/**
 * Lead Repository
 */

import { connectToDatabase } from "../mongoose";
import { LeadModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Lead } from "@/lib/types";

export interface LeadFilters {
  branchId?: string;
  status?: string;
  search?: string;
}

export const leadRepository = {
  async findAllAsync(filters?: LeadFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Lead>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await LeadModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await LeadModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Lead[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await LeadModel.find(query).sort({ createdAt: -1 }).lean<Lead[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Lead | undefined> {
    await connectToDatabase();
    const doc = await LeadModel.findOne({ id }).lean<Lead | null>();
    return doc ?? undefined;
  },

  async findByPhoneAsync(phone: string): Promise<Lead | undefined> {
    await connectToDatabase();
    const doc = await LeadModel.findOne({ phone }).lean<Lead | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
    await connectToDatabase();
    const now = formatDate();
    const lead: Lead = {
      ...data,
      id: generateId("LED"),
      createdAt: now,
      updatedAt: now,
    };
    await LeadModel.create(lead);
    return lead;
  },

  async updateAsync(id: string, data: Partial<Lead>): Promise<Lead | undefined> {
    await connectToDatabase();
    const doc = await LeadModel.findOneAndUpdate(
      { id },
      { ...data, updatedAt: formatDate() },
      { new: true }
    ).lean<Lead | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await LeadModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async getStatsAsync(branchId?: string) {
    await connectToDatabase();
    const query: Record<string, unknown> = {};
    if (branchId) query.branchId = branchId;

    const allLeads = await LeadModel.find(query).lean<Lead[]>();

    return {
      total: allLeads.length,
      new: allLeads.filter((l) => l.status === "new").length,
      contacted: allLeads.filter((l) => l.status === "contacted").length,
      converted: allLeads.filter((l) => l.status === "converted").length,
    };
  },
};
