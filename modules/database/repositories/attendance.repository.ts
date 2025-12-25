/**
 * Attendance Repository
 */

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
  async findAllAsync(filters?: AttendanceFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AttendanceRecord>> {
    await connectToDatabase();

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
    await connectToDatabase();
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
    await connectToDatabase();
    const record: AttendanceRecord = {
      ...data,
      id: generateId("ATT"),
    };
    await AttendanceModel.create(record);
    return record;
  },

  async checkOutAsync(id: string): Promise<AttendanceRecord | undefined> {
    await connectToDatabase();
    const doc = await AttendanceModel.findOneAndUpdate(
      { id },
      { $set: { checkOutTime: formatDate() } },
      { new: true }
    ).lean<AttendanceRecord | null>();
    return doc ?? undefined;
  },

  async getLiveCountAsync(branchId: string): Promise<number> {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    return await AttendanceModel.countDocuments({
      branchId,
      status: "success",
      checkInTime: { $regex: `^${today}` },
      checkOutTime: { $exists: false },
    }).exec();
  },

  async getTodayCountAsync(branchId: string): Promise<number> {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    return await AttendanceModel.countDocuments({
      branchId,
      status: "success",
      checkInTime: { $regex: `^${today}` },
    }).exec();
  },

  async getRecentByBranchAsync(branchId: string, limit: number = 5): Promise<AttendanceRecord[]> {
    await connectToDatabase();
    return await AttendanceModel.find({ branchId })
      .sort({ checkInTime: -1 })
      .limit(limit)
      .lean<AttendanceRecord[]>();
  },
};
