/**
 * Dashboard Service
 */

import {
  branchRepository,
  memberRepository,
  deviceRepository,
  paymentRepository,
  attendanceRepository,
} from "@/modules/database";

export interface SuperAdminStats {
  stats: Array<{
    title: string;
    value: string | number;
    change: string;
    trend: "up" | "down";
  }>;
  charts: {
    revenueByMonth: Array<{ name: string; revenue: number }>;
    newVsChurnedByMonth: Array<{ month: string; newMembers: number; churned: number }>;
    memberComposition: Array<{ name: string; value: number }>;
    topBranches: Array<{ name: string; revenue: number; members: number }>;
  };
  recentActivity: Array<{
    name: string;
    action: string;
    amount: string;
    time: string;
  }>;
}

export interface BranchStats {
  stats: Array<{
    title: string;
    value: string | number;
    sub: string;
    color: string;
  }>;
  charts: {
    attendanceTrend: Array<{ time: string; users: number }>;
  };
  recentCheckIns: Array<{
    name: string;
    time: string;
    method: string;
    status: string;
  }>;
  expiringMembers: Array<{
    name: string;
    days: number;
  }>;
}

export const dashboardService = {
  /**
   * Get super admin dashboard stats
   */
  async getSuperAdminStats(branchId?: string): Promise<SuperAdminStats> {
    const branches = await branchRepository.findAllAsync();
    const activeBranches = branches.data.filter(b => b.status === "active").length;

    // If branchId is provided, we filter everything by that branch
    const members = branchId
      ? { data: (await memberRepository.findByBranchAsync(branchId)), total: (await memberRepository.findByBranchAsync(branchId)).length }
      : await memberRepository.findAllAsync();

    const activeMembers = members.data.filter((m: any) => m.status === "Active").length;

    const deviceStats = await deviceRepository.getStatsAsync(branchId);

    const allPayments = branchId
      ? (await paymentRepository.findAllAsync({ branchId })).data
      : (await paymentRepository.findAllAsync()).data;

    const now = new Date();
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const last30Completed = allPayments.filter(
      (p: any) => p.status === "completed" && p.createdAt >= thirtyDaysAgoIso
    );
    const monthlyRevenue = last30Completed.reduce((sum: number, p: any) => sum + p.amount, 0);

    // Member composition (Active / Churned / Expired)
    const activeCount = members.data.filter((m: any) => m.status === "Active").length;
    const expiredCount = members.data.filter((m: any) => m.status === "Expired").length;
    const churnedCount = members.data.filter(
      (m: any) => m.status === "Cancelled" || m.status === "Frozen"
    ).length;

    const churnRatePercent =
      members.total > 0 ? (churnedCount / members.total) * 100 : 0;

    // Avg attendance (last 30 days): average daily unique check-ins / active members
    const attendanceRecords = branchId
      ? (await attendanceRepository.findAllAsync({ branchId })).data
      : (await attendanceRepository.findAllAsync()).data;

    const daysWindow = 30;
    const dailyUnique = new Map<string, Set<string>>();
    attendanceRecords
      .filter((r: any) => r.status === "success" && r.checkInTime >= thirtyDaysAgoIso)
      .forEach((r: any) => {
        const dayKey = r.checkInTime.slice(0, 10);
        const set = dailyUnique.get(dayKey) ?? new Set<string>();
        set.add(r.memberId);
        dailyUnique.set(dayKey, set);
      });

    const totalUniqueAcrossDays = Array.from(dailyUnique.values()).reduce(
      (sum: number, set: Set<string>) => sum + set.size,
      0,
    );
    const avgDailyUnique = totalUniqueAcrossDays / daysWindow;
    const avgAttendancePercent =
      activeCount > 0 ? Math.min(100, (avgDailyUnique / activeCount) * 100) : 0;

    const memberComposition = [
      { name: "Active", value: activeCount },
      { name: "Churned", value: churnedCount },
      { name: "Expired", value: expiredCount },
    ];

    // New vs Churned members across last 5 months
    const monthKeys: { key: string; label: string }[] = [];
    const nowDate = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; // YYYY-MM
      const label = d.toLocaleString("en-US", { month: "short" });
      monthKeys.push({ key, label });
    }

    const newPerMonth = new Map<string, number>();
    const churnPerMonth = new Map<string, number>();

    members.data.forEach((m: any) => {
      if (m.createdAt) {
        const createdKey = m.createdAt.slice(0, 7); // YYYY-MM
        newPerMonth.set(createdKey, (newPerMonth.get(createdKey) || 0) + 1);
      }
      if (m.expiryDate && m.status !== "Active") {
        const expiryKey = m.expiryDate.slice(0, 7);
        churnPerMonth.set(expiryKey, (churnPerMonth.get(expiryKey) || 0) + 1);
      }
    });

    const newVsChurnedByMonth = monthKeys.map(({ key, label }) => ({
      month: label,
      newMembers: newPerMonth.get(key) || 0,
      churned: churnPerMonth.get(key) || 0,
    }));

    // Top branches by revenue and member count
    const revenueByBranch = new Map<string, number>();
    const completedPayments = allPayments.filter((p: any) => p.status === "completed");
    completedPayments.forEach((p: any) => {
      const current = revenueByBranch.get(p.branchId) || 0;
      revenueByBranch.set(p.branchId, current + p.amount);
    });

    const membersByBranch = new Map<string, number>();
    members.data.forEach((m: any) => {
      const current = membersByBranch.get(m.branchId) || 0;
      membersByBranch.set(m.branchId, current + 1);
    });

    let topBranches = branches.data
      .map(b => ({
        name: b.name,
        revenue: revenueByBranch.get(b.id) || 0,
        members: membersByBranch.get(b.id) || 0,
      }))
      // Only show branches that actually have some recorded revenue
      .filter(b => b.revenue > 0);

    topBranches.sort((a, b) => b.revenue - a.revenue);
    topBranches = topBranches.slice(0, 5);

    return {
      stats: [
        {
          title: branchId ? "Local Branches" : "Total Branches",
          value: branchId ? 1 : branches.total,
          change: branchId ? "Selected Region" : `${activeBranches} active`,
          trend: "up",
        },
        {
          title: branchId ? "Branch Members" : "Total Members",
          value: members.total.toLocaleString(),
          change: `${activeMembers} active`,
          trend: "up",
        },
        {
          title: branchId ? "Branch Revenue" : "Global Revenue",
          value: `₹${monthlyRevenue.toLocaleString()}`,
          change: "Last 30 days",
          trend: "up",
        },
        {
          title: "Churn Rate",
          value: `${churnRatePercent.toFixed(1)}%`,
          change: `${churnedCount} churned`,
          trend: churnRatePercent <= 5 ? "up" : "down",
        },
        {
          title: "Avg. Attendance",
          value: `${avgAttendancePercent.toFixed(0)}%`,
          change: "Last 30 days",
          trend: avgAttendancePercent >= 50 ? "up" : "down",
        },
        {
          title: "Active Devices",
          value: `${deviceStats.online}/${deviceStats.total}`,
          change: `${deviceStats.offline} offline`,
          trend: deviceStats.offline === 0 ? "up" : "down",
        },
      ],
      charts: {
        revenueByMonth: await this.getRevenueByMonth(branchId),
        newVsChurnedByMonth,
        memberComposition,
        topBranches,
      },
      recentActivity: await this.getRecentActivity(branchId),
    };
  },

  /**
   * Get branch dashboard stats
   */
  async getBranchStats(branchId: string, period?: string): Promise<BranchStats> {
    const members = await memberRepository.findByBranchAsync(branchId);
    const activeMembers = members.filter(m => m.status === "Active").length;

    const liveCheckIns = await attendanceRepository.getLiveCountAsync(branchId);
    const todayCollection = await paymentRepository.getTodayTotalAsync(branchId);
    const weekCollection = await paymentRepository.getWeekTotalAsync(branchId);
    const monthRenewals = await paymentRepository.getMonthRenewalsAsync(branchId);

    const expiringSoon = await memberRepository.getExpiringSoonAsync(branchId, 7);
    const expiringToday = await memberRepository.getExpiringTodayAsync(branchId);

    const todayAttendanceCount = await attendanceRepository.getTodayCountAsync(branchId);

    return {
      stats: [
        {
          title: "Live Check-ins",
          value: liveCheckIns,
          sub: "Members currently inside",
          color: "bg-green-100 text-green-600",
        },
        {
          title: "Today's Collections",
          value: `₹${todayCollection.amount.toLocaleString()}`,
          sub: `${todayCollection.count} payments received`,
          color: "bg-blue-100 text-blue-600",
        },
        {
          title: "Active Members",
          value: activeMembers,
          sub: `Total ${members.length} members`,
          color: "bg-purple-100 text-purple-600",
        },
        {
          title: "Expiring Soon",
          value: expiringSoon.length,
          sub: "Within next 7 days",
          color: "bg-orange-100 text-orange-600",
        },
        {
          title: "Today Plan Expiry",
          value: expiringToday.length,
          sub: "Memberships ending today",
          color: "bg-amber-100 text-amber-600",
        },
        {
          title: "Today's Attendance",
          value: todayAttendanceCount,
          sub: "Total successful check-ins today",
          color: "bg-rose-100 text-rose-600",
        },
        {
          title: "Week Collection",
          value: `₹${weekCollection.toLocaleString()}`,
          sub: "This week's collections",
          color: "bg-emerald-100 text-emerald-600",
        },
        {
          title: "Month Renewals",
          value: monthRenewals,
          sub: "Renewals in current month",
          color: "bg-indigo-100 text-indigo-600",
        },
      ],
      charts: {
        attendanceTrend: await this.getAttendanceTrend(branchId, period),
      },
      recentCheckIns: await this.getRecentCheckIns(branchId),
      expiringMembers: await this.getExpiringMembers(branchId),
    };
  },

  // Helper methods
  async getRevenueByMonth(branchId?: string) {
    const all = await paymentRepository.findAllAsync(branchId ? { branchId } : undefined);
    const payments = all.data.filter((p: any) => p.status === "completed");
    const monthMap = new Map<string, number>();

    payments.forEach((p: any) => {
      const date = new Date(p.createdAt);
      const monthName = date.toLocaleString("en-US", { month: "short" });
      monthMap.set(monthName, (monthMap.get(monthName) || 0) + p.amount);
    });

    const monthsOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return monthsOrder.map(name => ({
      name,
      revenue: monthMap.get(name) || 0,
    }));
  },

  async getAttendanceTrend(branchId: string, period: string = "day") {
    const now = new Date();
    let startDate = new Date();
    let aggregationType: "hour" | "day" | "week" | "month" = "hour";

    if (period === "week") {
      startDate.setDate(now.getDate() - 7);
      aggregationType = "day";
    } else if (period === "month") {
      startDate.setDate(1); // 1st of current month
      aggregationType = "week";
    } else if (period === "year") {
      startDate.setMonth(0, 1); // 1st Jan of current year
      aggregationType = "month";
    } else {
      // Day - strict filter for "today"
      startDate = new Date();
    }
    startDate.setHours(0, 0, 0, 0);

    const result = await attendanceRepository.findAllAsync({ branchId });
    // Filter by date range
    const records = result.data.filter((r: any) => {
      const rDate = new Date(r.checkInTime);
      if (period === "day") {
        return rDate.toDateString() === now.toDateString();
      }
      return rDate >= startDate;
    });

    const buckets = new Map<string, number>();

    // Initialize buckets based on type to ensure continuous axis
    if (aggregationType === "hour") {
      const dString = now.toISOString().split('T')[0];
      for (let i = 6; i <= 22; i++) { // Initialize from 6 AM to 10 PM (typical gym hours)
        const label = `${dString}T${i.toString().padStart(2, "0")}:00:00`;
        buckets.set(label, 0);
      }
    } else if (aggregationType === "day") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        buckets.set(d.toISOString().split('T')[0], 0);
      }
    } else if (aggregationType === "month") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthNames.forEach(m => buckets.set(m, 0));
    }
    // "week" (inside month) buckets can be dynamic "Week 1"..."Week 5"

    records.forEach((r: any) => {
      const date = new Date(r.checkInTime);
      let label = "";

      if (aggregationType === "hour") {
        const hour = date.getHours();
        label = `${date.toISOString().split("T")[0]}T${hour.toString().padStart(2, "0")}:00:00`;
      } else if (aggregationType === "day") {
        label = date.toISOString().split("T")[0];
      } else if (aggregationType === "week") {
        const day = date.getDate();
        const week = Math.ceil(day / 7);
        label = `Week ${week}`;
      } else if (aggregationType === "month") {
        label = date.toLocaleString("en-US", { month: "short" });
      }

      buckets.set(label, (buckets.get(label) || 0) + 1);
    });

    // For "day" (hour), fill empty hours if needed or just sort
    // For "week" (day), sort by date
    // For "month" (week), sort Week 1..5
    // For "year" (month), sort Jan..Dec

    const labels = Array.from(buckets.keys());

    if (aggregationType === "month") {
      // Sort months by calendar order
      const monthOrder: Record<string, number> = { "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5, "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11 };
      labels.sort((a, b) => monthOrder[a] - monthOrder[b]);
    } else if (aggregationType === "week") {
      labels.sort(); // Week 1, Week 2... ok alphabetically
    } else {
      labels.sort(); // ISO dates ok alphabetically
    }

    return labels.map(time => ({
      time,
      users: buckets.get(time) || 0,
    }));
  },

  async getRecentActivity(branchId?: string) {
    const all = await paymentRepository.findAllAsync(branchId ? { branchId } : undefined);
    const payments = all.data
      .filter((p: any) => p.status === "completed")
      .slice(0, 5);

    return payments.map((p: any) => ({
      name: p.memberName,
      action: p.description || "Membership Payment",
      amount: `+₹${p.amount.toLocaleString()}`,
      time: new Date(p.createdAt).toLocaleString(),
    }));
  },

  async getRecentCheckIns(branchId: string) {
    const records = await attendanceRepository.getRecentByBranchAsync(branchId, 5);

    return records.map(r => ({
      name: r.memberName,
      time: new Date(r.checkInTime).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      method: r.method,
      status: r.status,
    }));
  },

  async getExpiringMembers(branchId: string) {
    const members = await (async () => {
      try {
        return await memberRepository.getExpiringSoonAsync(branchId, 7);
      } catch {
        return memberRepository.getExpiringSoon(branchId, 7);
      }
    })();
    const today = new Date();

    return members.slice(0, 5).map(m => {
      const expiryDate = new Date(m.expiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        name: m.name.split(" ")[0] + " " + (m.name.split(" ")[1]?.[0] || "") + ".",
        days: Math.max(0, daysUntilExpiry),
      };
    });
  },
};
