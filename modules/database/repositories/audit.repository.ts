/**
 * Audit Repository
 */

import { connectToDatabase } from "../mongoose";
import { AuditLogModel } from "../models";
import { generateId, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { AuditLog } from "@/lib/types";

export interface AuditFilters {
  userId?: string;
  resource?: string;
  action?: string;
  branchId?: string;
}

export const auditRepository = {
  async findAllAsync(filters?: AuditFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.userId) query.userId = filters.userId;
    if (filters?.resource) query.resource = filters.resource;
    if (filters?.action) query.action = filters.action;
    if (filters?.branchId) query.branchId = filters.branchId;

    const total = await AuditLogModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await AuditLogModel.find(query)
        .sort({ timestamp: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<AuditLog[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await AuditLogModel.find(query).sort({ timestamp: -1 }).lean<AuditLog[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async createAsync(data: Omit<AuditLog, "id">): Promise<AuditLog> {
    await connectToDatabase();
    const log: AuditLog = {
      ...data,
      id: generateId("AUD"),
    };
    await AuditLogModel.create(log);
    return log;
  },

  async findByIdAsync(id: string): Promise<AuditLog | null> {
    await connectToDatabase();
    return await AuditLogModel.findOne({ id }).lean<AuditLog | null>();
  },

  async logAsync(
    userId: string,
    userName: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    branchId?: string
  ): Promise<AuditLog> {
    return this.createAsync({
      userId,
      userName,
      action,
      resource,
      resourceId: resourceId || "-",
      details,
      ipAddress,
      branchId,
      timestamp: new Date().toISOString(),
    });
  },
};
