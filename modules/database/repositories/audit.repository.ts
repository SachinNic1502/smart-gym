/**
 * Audit Log Repository
 */

import { getStore, persistStore } from "../store";
import { generateId, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { AuditLog } from "@/lib/types";

export interface AuditFilters {
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export const auditRepository = {
  findAll(filters: AuditFilters = {}, pagination?: PaginationOptions): PaginatedResult<AuditLog> {
    const store = getStore();
    let filtered = [...store.auditLogs];

    if (filters.userId) {
      filtered = filtered.filter(a => a.userId === filters.userId);
    }

    if (filters.resource) {
      filtered = filtered.filter(a => a.resource === filters.resource);
    }

    if (filters.action) {
      filtered = filtered.filter(a => a.action === filters.action);
    }

    if (filters.branchId) {
      filtered = filtered.filter(a => a.branchId === filters.branchId);
    }

    if (filters.startDate) {
      filtered = filtered.filter(a => a.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter(a => a.timestamp <= filters.endDate!);
    }

    // Sort by most recent
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return paginate(filtered, pagination);
  },

  create(data: Omit<AuditLog, "id" | "timestamp">): AuditLog {
    const store = getStore();
    const log: AuditLog = {
      ...data,
      id: generateId("AUD"),
      timestamp: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    persistStore();
    return log;
  },

  // Utility to log actions
  log(
    userId: string,
    userName: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    branchId?: string
  ): AuditLog {
    return this.create({
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      branchId,
    });
  },
};
