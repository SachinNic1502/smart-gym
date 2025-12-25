"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { dashboardApi, ApiError } from "@/lib/api/client";
import type { DashboardData } from "@/lib/types";

interface DashboardContextType {
    data: DashboardData | null;
    loading: boolean;
    error: string | null;
    selectedBranchId: string;
    setSelectedBranchId: (id: string) => void;
    refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string>("all");

    const refresh = useCallback(async () => {
        setLoading(true);
        // Don't clear error here to avoid flickering if refresh fails
        try {
            const role = "super_admin";
            const branchParam = selectedBranchId === "all" ? undefined : selectedBranchId;
            const result = await dashboardApi.getStats(role, branchParam);
            setData(result as DashboardData);
            setError(null);
        } catch (err) {
            const message = err instanceof ApiError ? err.message : "Failed to load dashboard data";
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [selectedBranchId]);

    // Initial load and branch change
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Polling effect
    useEffect(() => {
        const interval = setInterval(() => {
            refresh();
        }, 60000); // Poll every minute for "real-time" updates without too much overhead

        return () => clearInterval(interval);
    }, [refresh]);

    return (
        <DashboardContext.Provider value={{ data, loading, error, selectedBranchId, setSelectedBranchId, refresh }}>
            {children}
        </DashboardContext.Provider>
    );
}

export function useDashboard() {
    const context = useContext(DashboardContext);
    if (context === undefined) {
        throw new Error("useDashboard must be used within a DashboardProvider");
    }
    return context;
}
