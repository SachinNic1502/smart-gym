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
  getAttendance(filters?: AttendanceFilters, pagination?: PaginationOptions): PaginatedResult<AttendanceRecord> {
    return attendanceRepository.findAll(filters, pagination);
  },

  /**
   * Record a check-in or check-out
   */
  checkIn(data: CheckInData): ServiceResult<AttendanceRecord> {
    const { memberId, branchId, method, deviceId } = data;

    // Validate member
    const member = memberRepository.findById(memberId);
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check if member is active
    if (member.status !== "Active") {
      // Record failed attempt
      const record = attendanceRepository.create({
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
    const existingCheckIn = attendanceRepository.findTodayByMember(memberId);
    if (existingCheckIn) {
      const record = attendanceRepository.checkOut(existingCheckIn.id);
      return { success: true, data: record, message: "Checked out successfully" };
    }

    // Create new check-in
    const record = attendanceRepository.create({
      memberId,
      memberName: member.name,
      branchId,
      checkInTime: formatDate(),
      method,
      status: "success",
      deviceId,
    });

    // Update member's last visit
    memberRepository.update(memberId, { lastVisit: record.checkInTime });

    return { success: true, data: record, message: "Checked in successfully" };
  },

  /**
   * Get live check-in count for a branch
   */
  getLiveCount(branchId: string): number {
    return attendanceRepository.getLiveCount(branchId);
  },

  /**
   * Get recent check-ins for a branch
   */
  getRecentCheckIns(branchId: string, limit: number = 5): AttendanceRecord[] {
    return attendanceRepository.getRecentByBranch(branchId, limit);
  },
};
