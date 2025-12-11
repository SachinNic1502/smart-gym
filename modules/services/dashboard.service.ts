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
  getSuperAdminStats(): SuperAdminStats {
    const branches = branchRepository.findAll();
    const activeBranches = branches.data.filter(b => b.status === "active").length;
    
    const members = memberRepository.findAll();
    const activeMembers = members.data.filter(m => m.status === "Active").length;
    
    const deviceStats = deviceRepository.getStats();

    const allPayments = paymentRepository.findAll().data;
    const now = new Date();
    const thirtyDaysAgoIso = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const last30Completed = allPayments.filter(
      p => p.status === "completed" && p.createdAt >= thirtyDaysAgoIso
    );
    const monthlyRevenue = last30Completed.reduce((sum, p) => sum + p.amount, 0);

    // Member composition (Active / Churned / Expired)
    const activeCount = members.data.filter(m => m.status === "Active").length;
    const expiredCount = members.data.filter(m => m.status === "Expired").length;
    const churnedCount = members.data.filter(
      m => m.status === "Cancelled" || m.status === "Frozen"
    ).length;

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

    members.data.forEach(m => {
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
    const completedPayments = allPayments.filter(p => p.status === "completed");
    completedPayments.forEach(p => {
      const current = revenueByBranch.get(p.branchId) || 0;
      revenueByBranch.set(p.branchId, current + p.amount);
    });

    const membersByBranch = new Map<string, number>();
    members.data.forEach(m => {
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
          title: "Total Branches",
          value: branches.total,
          change: `${activeBranches} active`,
          trend: "up",
        },
        {
          title: "Total Members",
          value: members.total.toLocaleString(),
          change: `${activeMembers} active`,
          trend: "up",
        },
        {
          title: "Global Revenue",
          value: `₹${monthlyRevenue.toLocaleString()}`,
          change: "Last 30 days",
          trend: "up",
        },
        {
          title: "Active Devices",
          value: `${deviceStats.online}/${deviceStats.total}`,
          change: `${deviceStats.offline} offline`,
          trend: deviceStats.offline === 0 ? "up" : "down",
        },
      ],
      charts: {
        revenueByMonth: this.getRevenueByMonth(),
        newVsChurnedByMonth,
        memberComposition,
        topBranches,
      },
      recentActivity: this.getRecentActivity(),
    };
  },

  /**
   * Get branch dashboard stats
   */
  getBranchStats(branchId: string): BranchStats {
    const members = memberRepository.findByBranch(branchId);
    const activeMembers = members.filter(m => m.status === "Active").length;
    
    const liveCheckIns = attendanceRepository.getLiveCount(branchId);
    const todayCollection = paymentRepository.getTodayTotal(branchId);
    const weekCollection = paymentRepository.getWeekTotal(branchId);
    const monthRenewals = paymentRepository.getMonthRenewals(branchId);
    
    const expiringSoon = memberRepository.getExpiringSoon(branchId, 7);
    const expiringToday = memberRepository.getExpiringToday(branchId);

    const todayAttendanceCount = attendanceRepository.getTodayCount(branchId);

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
        attendanceTrend: this.getAttendanceTrend(branchId),
      },
      recentCheckIns: this.getRecentCheckIns(branchId),
      expiringMembers: this.getExpiringMembers(branchId),
    };
  },

  // Helper methods
  getRevenueByMonth() {
    const payments = paymentRepository.findAll().data.filter(p => p.status === "completed");
    const monthMap = new Map<string, number>();

    payments.forEach(p => {
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

  getAttendanceTrend(branchId: string) {
    const today = new Date().toISOString().split("T")[0];
    const result = attendanceRepository.findAll({ branchId, date: today });
    const records = result.data;

    const buckets = new Map<string, number>();

    records.forEach(r => {
      const date = new Date(r.checkInTime);
      const hour = date.getHours();
      const label = `${hour.toString().padStart(2, "0")}:00`;
      buckets.set(label, (buckets.get(label) || 0) + 1);
    });

    const labels = Array.from(buckets.keys()).sort();

    return labels.map(time => ({
      time,
      users: buckets.get(time) || 0,
    }));
  },

  getRecentActivity() {
    const payments = paymentRepository.findAll().data
      .filter(p => p.status === "completed")
      .slice(0, 5);

    return payments.map(p => ({
      name: p.memberName,
      action: p.description || "Membership Payment",
      amount: `+₹${p.amount.toLocaleString()}`,
      time: new Date(p.createdAt).toLocaleString(),
    }));
  },

  getRecentCheckIns(branchId: string) {
    const records = attendanceRepository.getRecentByBranch(branchId, 5);

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

  getExpiringMembers(branchId: string) {
    const members = memberRepository.getExpiringSoon(branchId, 7);
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
