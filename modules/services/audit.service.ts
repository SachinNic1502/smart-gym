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
  getAuditLogs(filters?: AuditFilters, pagination?: PaginationOptions): AuditListResult {
    return auditRepository.findAll(filters || {}, pagination);
  },

  /**
   * Log an audit action from API routes and services
   */
  logAction(params: {
    userId?: string | null;
    userName?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }): AuditLog {
    const {
      userId,
      userName,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
    } = params;

    const safeUserId = userId ?? "SYSTEM";
    const safeUserName = userName ?? "System";
    const safeResourceId = resourceId ?? "-";

    return auditRepository.log(
      safeUserId,
      safeUserName,
      action,
      resource,
      safeResourceId,
      details,
      ipAddress,
    );
  },
};
