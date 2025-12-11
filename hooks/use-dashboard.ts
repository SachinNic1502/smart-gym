/**
 * Dashboard Hooks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { dashboardApi, ApiError } from "@/lib/api/client";

interface DashboardState<T> {
  stats: T | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardStats<T = Record<string, unknown>>(
  role: "super_admin" | "branch_admin" = "super_admin",
  branchId?: string
) {
  const [state, setState] = useState<DashboardState<T>>({
    stats: null,
    loading: true,
    error: null,
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await dashboardApi.getStats(role, branchId);
      setState({ stats: response as T, loading: false, error: null });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch dashboard stats";
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [role, branchId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...state, refetch: fetchStats };
}

export function useSuperAdminDashboard() {
  return useDashboardStats("super_admin");
}

export function useBranchDashboard(branchId: string) {
  return useDashboardStats("branch_admin", branchId);
}
