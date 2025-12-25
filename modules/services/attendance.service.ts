/**
 * Attendance Service
 */

import { attendanceRepository, memberRepository, notificationRepository, userRepository } from "@/modules/database";
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
    const member = await memberRepository.findByIdAsync(memberId);
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
      const now = formatDate();
      const record = await attendanceRepository.createAsync({
        memberId,
        memberName: member.name,
        branchId,
        date: now.split("T")[0],
        checkInTime: now,
        method,
        status: "failed",
        deviceId,
      });

      // Notify Branch Admins about failed entry attempt
      try {
        const branchAdmins = await userRepository.findByBranchAsync(branchId);
        const adminUsers = branchAdmins.filter(u => u.role === "branch_admin");

        for (const admin of adminUsers) {
          await notificationRepository.createAsync({
            userId: admin.id,
            type: "system_announcement",
            title: "Access Denied Alert",
            message: `${member.name} attempted entry but status is ${member.status}${isExpiredByDate ? ' (Expired Plan)' : ''}`,
            priority: "high",
            status: "unread",
            read: false,
            data: { memberId, status: member.status, isExpired: isExpiredByDate },
            branchId
          });
        }
      } catch (e) {
        console.warn("Failed to notify admins about denied entry", e);
      }

      return { success: false, error: "Member subscription has expired", data: record };
    }

    // Check if already checked in today (for check-out)
    const existingCheckIn = await attendanceRepository.findTodayByMemberAsync(memberId);
    if (existingCheckIn) {
      const record = await attendanceRepository.checkOutAsync(existingCheckIn.id);
      return { success: true, data: record, message: "Checked out successfully" };
    }

    // Create new check-in
    const now = formatDate();
    const record = await attendanceRepository.createAsync({
      memberId,
      memberName: member.name,
      branchId,
      date: now.split("T")[0],
      checkInTime: now,
      method,
      status: "success",
      deviceId,
    });

    // Update member's last visit
    await memberRepository.updateAsync(memberId, { lastVisit: record.checkInTime });

    // Notify member about successful check-in
    try {
      await notificationRepository.createAsync({
        userId: memberId,
        type: "system_announcement",
        title: "Welcome to Smart Fit!",
        message: `You checked in at ${new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Have a great workout!`,
        priority: "low",
        status: "unread",
        read: false,
        data: { attendanceId: record.id },
        branchId
      });
    } catch (e) {
      console.warn("Failed to notify member about check-in", e);
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
