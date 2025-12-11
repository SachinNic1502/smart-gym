/**
 * Lead Repository
 */

import { getStore } from "../store";
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
};
