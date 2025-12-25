/**
 * Audit Service
 */

import { auditRepository, type AuditFilters, type PaginationOptions, type PaginatedResult } from "@/modules/database";
import type { AuditLog } from "@/lib/types";

export type AuditListResult = PaginatedResult<AuditLog>;

export const auditService = {
  /**
   * Get audit logs with optional filters and pagination
   */
  async getAuditLogs(filters?: AuditFilters, pagination?: PaginationOptions): Promise<AuditListResult> {
    return auditRepository.findAllAsync(filters || {}, pagination);
  },

  /**
   * Log an audit action from API routes and services
   */
  async logAction(params: {
    userId?: string | null;
    userName?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: Record<string, unknown>;
    ipAddress?: string;
    branchId?: string;
  }): Promise<AuditLog> {
    const {
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      branchId,
    } = params;

    const safeUserId = userId ?? "SYSTEM";
    const safeUserName = userName ?? "System";
    const safeResourceId = resourceId ?? "-";

    return auditRepository.logAsync(
      safeUserId,
      safeUserName,
      action,
      resource,
      safeResourceId,
      details,
      ipAddress,
      branchId,
    );
  },
};
