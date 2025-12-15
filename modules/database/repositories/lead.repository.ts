/**
 * Lead Repository
 */

import { getStore } from "../store";
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
  findAll(filters?: LeadFilters, pagination?: PaginationOptions): PaginatedResult<Lead> {
    let leads = [...getStore().leads];

    if (filters) {
      if (filters.branchId) {
        leads = leads.filter(l => l.branchId === filters.branchId);
      }
      if (filters.status) {
        leads = leads.filter(l => l.status === filters.status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        leads = leads.filter(l =>
          l.name.toLowerCase().includes(search) ||
          l.phone.includes(search) ||
          l.email?.toLowerCase().includes(search)
        );
      }
    }

    leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (pagination) {
      return paginate(leads, pagination);
    }

    return {
      data: leads,
      total: leads.length,
      page: 1,
      pageSize: leads.length,
      totalPages: 1,
    };
  },

  findById(id: string): Lead | undefined {
    return getStore().leads.find(l => l.id === id);
  },

  findByPhone(phone: string): Lead | undefined {
    const normalized = phone.replace(/\D/g, "");
    return getStore().leads.find(l => l.phone.replace(/\D/g, "") === normalized);
  },

  create(data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead {
    const now = formatDate();
    const lead: Lead = {
      ...data,
      id: generateId("LED"),
      createdAt: now,
      updatedAt: now,
    };
    getStore().leads.unshift(lead);
    return lead;
  },

  update(id: string, data: Partial<Lead>): Lead | undefined {
    const store = getStore();
    const index = store.leads.findIndex(l => l.id === id);
    if (index === -1) return undefined;

    store.leads[index] = {
      ...store.leads[index],
      ...data,
      id,
      updatedAt: formatDate(),
    };
    return store.leads[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.leads.findIndex(l => l.id === id);
    if (index === -1) return false;
    store.leads.splice(index, 1);
    return true;
  },

  getStats(branchId?: string) {
    const leads = branchId 
      ? getStore().leads.filter(l => l.branchId === branchId)
      : getStore().leads;
    
    return {
      total: leads.length,
      new: leads.filter(l => l.status === "new").length,
      contacted: leads.filter(l => l.status === "contacted").length,
      interested: leads.filter(l => l.status === "interested").length,
      converted: leads.filter(l => l.status === "converted").length,
      lost: leads.filter(l => l.status === "lost").length,
    };
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters?: LeadFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Lead>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.status) query.status = filters.status;
    if (filters?.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
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

  async getStatsAsync(branchId?: string): Promise<ReturnType<typeof leadRepository.getStats>> {
    try {
      await connectToDatabase();
    } catch {
      return this.getStats(branchId);
    }

    const query: Record<string, unknown> = {};
    if (branchId) query.branchId = branchId;

    const docs = await LeadModel.find(query).lean<Lead[]>();

    return {
      total: docs.length,
      new: docs.filter(l => l.status === "new").length,
      contacted: docs.filter(l => l.status === "contacted").length,
      interested: docs.filter(l => l.status === "interested").length,
      converted: docs.filter(l => l.status === "converted").length,
      lost: docs.filter(l => l.status === "lost").length,
    };
  },

  async findByIdAsync(id: string): Promise<Lead | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findById(id);
    }
    const doc = await LeadModel.findOne({ id }).lean<Lead | null>();
    return doc ?? undefined;
  },

  async findByPhoneAsync(phone: string): Promise<Lead | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findByPhone(phone);
    }
    const normalized = phone.replace(/\D/g, "");
    const docs = await LeadModel.find({}).lean<Lead[]>();
    const match = docs.find(l => l.phone.replace(/\D/g, "") === normalized);
    return match ?? undefined;
  },

  async createAsync(data: Omit<Lead, "id" | "createdAt" | "updatedAt">): Promise<Lead> {
    const lead = this.create(data);

    try {
      await connectToDatabase();
      await LeadModel.create(lead);
    } catch {
      // ignore and keep in-memory
    }

    return lead;
  },

  async updateAsync(id: string, data: Partial<Lead>): Promise<Lead | undefined> {
    const updated = this.update(id, data);
    try {
      await connectToDatabase();
      const doc = await LeadModel.findOneAndUpdate(
        { id },
        { ...data, id, updatedAt: formatDate() },
        { new: true },
      ).lean<Lead | null>();
      return doc ?? updated;
    } catch {
      return updated;
    }
  },

  async deleteAsync(id: string): Promise<boolean> {
    const deleted = this.delete(id);
    try {
      await connectToDatabase();
      const res = await LeadModel.deleteOne({ id }).exec();
      return res.deletedCount === 1;
    } catch {
      return deleted;
    }
  },
};
