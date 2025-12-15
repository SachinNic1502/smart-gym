/**
 * Attendance Service
 */

import { attendanceRepository, memberRepository } from "@/modules/database";
import { formatDate } from "@/modules/database/repositories/base.repository";
import type { AttendanceRecord, AttendanceMethod } from "@/lib/types";
import type { AttendanceFilters, PaginationOptions, PaginatedResult } from "@/modules/database";

export interface CheckInData {
  memberId: string;
  branchId: string;
  method: AttendanceMethod;
  deviceId?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const attendanceService = {
  /**
   * Get attendance records with filters and pagination
   */
  async getAttendance(filters?: AttendanceFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AttendanceRecord>> {
    return attendanceRepository.findAllAsync(filters, pagination);
  },

  /**
   * Record a check-in or check-out
   */
  async checkIn(data: CheckInData): Promise<ServiceResult<AttendanceRecord>> {
    const { memberId, branchId, method, deviceId } = data;

    // Validate member
    const member = await (async () => {
      try {
        return await memberRepository.findByIdAsync(memberId);
      } catch {
        return memberRepository.findById(memberId);
      }
    })();
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    if (member.branchId !== branchId) {
      return { success: false, error: "Member does not belong to this branch" };
    }

    // Check if member is active
    const expiry = new Date(member.expiryDate);
    const isExpiredByDate = !Number.isNaN(expiry.getTime()) && expiry < new Date();

    if (member.status !== "Active" || isExpiredByDate) {
      // Record failed attempt
      const record = await attendanceRepository.createAsync({
        memberId,
        memberName: member.name,
        branchId,
        checkInTime: formatDate(),
        method,
        status: "failed",
        deviceId,
      });
      return { success: false, error: "Member subscription has expired", data: record };
    }

    // Check if already checked in today (for check-out)
    const existingCheckIn = await attendanceRepository.findTodayByMemberAsync(memberId);
    if (existingCheckIn) {
      const record = await attendanceRepository.checkOutAsync(existingCheckIn.id);
      return { success: true, data: record, message: "Checked out successfully" };
    }

    // Create new check-in
    const record = await attendanceRepository.createAsync({
      memberId,
      memberName: member.name,
      branchId,
      checkInTime: formatDate(),
      method,
      status: "success",
      deviceId,
    });

    // Update member's last visit
    try {
      await memberRepository.updateAsync(memberId, { lastVisit: record.checkInTime });
    } catch {
      memberRepository.update(memberId, { lastVisit: record.checkInTime });
    }

    return { success: true, data: record, message: "Checked in successfully" };
  },

  /**
   * Get live check-in count for a branch
   */
  async getLiveCount(branchId: string): Promise<number> {
    return attendanceRepository.getLiveCountAsync(branchId);
  },

  /**
   * Get recent check-ins for a branch
   */
  async getRecentCheckIns(branchId: string, limit: number = 5): Promise<AttendanceRecord[]> {
    return attendanceRepository.getRecentByBranchAsync(branchId, limit);
  },
};
