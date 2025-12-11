/**
 * Attendance Repository
 */

import { getStore } from "../store";
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
};
