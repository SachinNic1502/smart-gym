/**
 * use-settings.tsx
 * Settings Hook for managing global system settings.
 */

"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { settingsApi } from "@/lib/api/client";
import type { SystemSettings } from "@/lib/types";

interface SettingsContextType {
    settings: SystemSettings | null;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    updateSettings: (newSettings: Partial<SystemSettings>) => void;
    formatCurrency: (amount: number) => string;
    formatDate: (date: string | Date | number) => string;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: null,
    loading: true,
    refreshSettings: async () => { },
    updateSettings: () => { },
    formatCurrency: (amount) => `₹${amount}`,
    formatDate: (date) => String(date),
});

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const data = await settingsApi.get();
            setSettings(data);
        } catch (e) {
            console.warn("Failed to fetch global settings", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSettings = useCallback((newSettings: Partial<SystemSettings>) => {
        setSettings(prev => prev ? { ...prev, ...newSettings } : null);
    }, []);

    const formatCurrency = useCallback((amount: number) => {
        if (!settings) return `₹${amount.toLocaleString()}`;
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: settings.currency || "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    }, [settings]);

    const formatDate = useCallback((date: string | Date | number) => {
        const d = new Date(date);
        if (isNaN(d.getTime())) return String(date);

        const format = settings?.dateFormat || "dd/MM/yyyy";
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");
        const year = d.getFullYear();

        if (format === "MM/dd/yyyy") return `${month}/${day}/${year}`;
        if (format === "yyyy-MM-dd") return `${year}-${month}-${day}`;
        return `${day}/${month}/${year}`;
    }, [settings?.dateFormat]);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                loading,
                refreshSettings: fetchSettings,
                updateSettings,
                formatCurrency,
                formatDate
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => useContext(SettingsContext);
