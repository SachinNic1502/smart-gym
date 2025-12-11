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
  getLeads(filters?: LeadFilters, pagination?: PaginationOptions): LeadListResult {
    const result = leadRepository.findAll(filters, pagination);
    const stats = leadRepository.getStats(filters?.branchId);

    return { ...result, stats };
  },

  /**
   * Get a single lead by ID
   */
  getLead(id: string): ServiceResult<Lead> {
    const lead = leadRepository.findById(id);
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: lead };
  },

  /**
   * Create a new lead
   */
  createLead(data: CreateLeadData): ServiceResult<Lead> {
    // Check for duplicate phone
    const existingPhone = leadRepository.findByPhone(data.phone);
    if (existingPhone) {
      return { success: false, error: "A lead with this phone number already exists" };
    }

    const lead = leadRepository.create({
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
  updateLead(id: string, data: Partial<Lead>): ServiceResult<Lead> {
    const lead = leadRepository.update(id, data);
    if (!lead) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: lead };
  },

  /**
   * Delete a lead
   */
  deleteLead(id: string): ServiceResult<{ id: string }> {
    const deleted = leadRepository.delete(id);
    if (!deleted) {
      return { success: false, error: "Lead not found" };
    }
    return { success: true, data: { id } };
  },
};
