/**
 * Lead Service
 */

import { leadRepository } from "@/modules/database";
import type { Lead } from "@/lib/types";
import type { LeadFilters, PaginationOptions, PaginatedResult } from "@/modules/database";

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  source: string;
  notes?: string;
  branchId: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LeadListResult extends PaginatedResult<Lead> {
  stats: ReturnType<typeof leadRepository.getStats>;
}

export const leadService = {
  /**
   * Get leads with filters and pagination
   */
  async getLeads(filters?: LeadFilters, pagination?: PaginationOptions): Promise<LeadListResult> {
    const result = await leadRepository.findAllAsync(filters, pagination);
    const stats = await leadRepository.getStatsAsync(filters?.branchId);

    return { ...result, stats };
  },

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<ServiceResult<Lead>> {
    const lead = await leadRepository.findByIdAsync(id);
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: lead };
  },

  /**
   * Create a new lead
   */
  async createLead(data: CreateLeadData): Promise<ServiceResult<Lead>> {
    // Check for duplicate phone
    const existingPhone = await leadRepository.findByPhoneAsync(data.phone);
    if (existingPhone) {
      return { success: false, error: "A lead with this phone number already exists" };
    }

    const lead = await leadRepository.createAsync({
      name: data.name,
      phone: data.phone,
      email: data.email,
      source: data.source,
      status: "new",
      notes: data.notes,
      branchId: data.branchId,
    });

    return { success: true, data: lead };
  },

  /**
   * Update a lead
   */
  async updateLead(id: string, data: Partial<Lead>): Promise<ServiceResult<Lead>> {
    const lead = await leadRepository.updateAsync(id, data);
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: lead };
  },

  /**
   * Delete a lead
   */
  async deleteLead(id: string): Promise<ServiceResult<{ id: string }>> {
    const deleted = await leadRepository.deleteAsync(id);
    if (!deleted) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: { id } };
  },
};
