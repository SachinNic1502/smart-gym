/**
 * Attendance Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { AttendanceModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { AttendanceRecord } from "@/lib/types";

export interface AttendanceFilters {
  branchId?: string;
  memberId?: string;
  date?: string;
  status?: string;
}

export const attendanceRepository = {
  findAll(filters?: AttendanceFilters, pagination?: PaginationOptions): PaginatedResult<AttendanceRecord> {
    let records = [...getStore().attendance];

    if (filters) {
      if (filters.branchId) {
        records = records.filter(a => a.branchId === filters.branchId);
      }
      if (filters.memberId) {
        records = records.filter(a => a.memberId === filters.memberId);
      }
      if (filters.date) {
        records = records.filter(a => a.checkInTime.startsWith(filters.date!));
      }
      if (filters.status) {
        records = records.filter(a => a.status === filters.status);
      }
    }

    records.sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

    if (pagination) {
      return paginate(records, pagination);
    }

    return {
      data: records,
      total: records.length,
      page: 1,
      pageSize: records.length,
      totalPages: 1,
    };
  },

  findById(id: string): AttendanceRecord | undefined {
    return getStore().attendance.find(a => a.id === id);
  },

  findTodayByMember(memberId: string): AttendanceRecord | undefined {
    const today = new Date().toISOString().split("T")[0];
    return getStore().attendance.find(
      a => a.memberId === memberId && a.checkInTime.startsWith(today) && a.status === "success" && !a.checkOutTime
    );
  },

  create(data: Omit<AttendanceRecord, "id">): AttendanceRecord {
    const record: AttendanceRecord = {
      ...data,
      id: generateId("ATT"),
    };
    getStore().attendance.unshift(record);
    return record;
  },

  checkOut(id: string): AttendanceRecord | undefined {
    const store = getStore();
    const record = store.attendance.find(a => a.id === id);
    if (record) {
      record.checkOutTime = formatDate();
    }
    return record;
  },

  getLiveCount(branchId: string): number {
    const today = new Date().toISOString().split("T")[0];
    return getStore().attendance.filter(
      a => a.branchId === branchId && a.checkInTime.startsWith(today) && a.status === "success" && !a.checkOutTime
    ).length;
  },

  getTodayCount(branchId: string): number {
    const today = new Date().toISOString().split("T")[0];
    return getStore().attendance.filter(
      a => a.branchId === branchId && a.checkInTime.startsWith(today) && a.status === "success"
    ).length;
  },

  getRecentByBranch(branchId: string, limit: number = 5): AttendanceRecord[] {
    return getStore().attendance
      .filter(a => a.branchId === branchId)
      .slice(0, limit);
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters?: AttendanceFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AttendanceRecord>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.memberId) query.memberId = filters.memberId;
    if (filters?.status) query.status = filters.status;
    if (filters?.date) {
      query.checkInTime = { $regex: `^${filters.date}` };
    }

    const total = await AttendanceModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await AttendanceModel.find(query)
        .sort({ checkInTime: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<AttendanceRecord[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await AttendanceModel.find(query)
      .sort({ checkInTime: -1 })
      .lean<AttendanceRecord[]>();

    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findTodayByMemberAsync(memberId: string): Promise<AttendanceRecord | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findTodayByMember(memberId);
    }

    const today = new Date().toISOString().split("T")[0];
    const doc = await AttendanceModel.findOne({
      memberId,
      status: "success",
      checkInTime: { $regex: `^${today}` },
      checkOutTime: { $exists: false },
    }).lean<AttendanceRecord | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<AttendanceRecord, "id">): Promise<AttendanceRecord> {
    const record = this.create(data);

    try {
      await connectToDatabase();
      await AttendanceModel.create(record);
    } catch {
      // ignore
    }

    return record;
  },

  async checkOutAsync(id: string): Promise<AttendanceRecord | undefined> {
    const updated = this.checkOut(id);

    try {
      await connectToDatabase();
      await AttendanceModel.updateOne({ id }, { $set: { checkOutTime: formatDate() } }).exec();
    } catch {
      // ignore
    }

    return updated;
  },

  async getLiveCountAsync(branchId: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getLiveCount(branchId);
    }

    const today = new Date().toISOString().split("T")[0];
    const count = await AttendanceModel.countDocuments({
      branchId,
      status: "success",
      checkInTime: { $regex: `^${today}` },
      checkOutTime: { $exists: false },
    }).exec();
    return count;
  },

  async getTodayCountAsync(branchId: string): Promise<number> {
    try {
      await connectToDatabase();
    } catch {
      return this.getTodayCount(branchId);
    }

    const today = new Date().toISOString().split("T")[0];
    const count = await AttendanceModel.countDocuments({
      branchId,
      status: "success",
      checkInTime: { $regex: `^${today}` },
    }).exec();
    return count;
  },

  async getRecentByBranchAsync(branchId: string, limit: number = 5): Promise<AttendanceRecord[]> {
    try {
      await connectToDatabase();
    } catch {
      return this.getRecentByBranch(branchId, limit);
    }

    const docs = await AttendanceModel.find({ branchId })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .lean<AttendanceRecord[]>();
    return docs;
  },
};
