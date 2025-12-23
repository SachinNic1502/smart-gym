"use client";

import { useState, useEffect, useCallback } from "react";
import { devicesApi, ApiError } from "@/lib/api/client";
import type { Device } from "@/lib/types";

interface DeviceStats {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
}

interface DevicesState {
  devices: Device[];
  total: number;
  loading: boolean;
  error: string | null;
  stats: DeviceStats | null;
}

interface DeviceFilters {
  branchId?: string;
  status?: string;
  type?: string;
}

export function useDevices(initialFilters?: DeviceFilters) {
  const [filters, setFilters] = useState<DeviceFilters>(initialFilters || {});
  const [state, setState] = useState<DevicesState>({
    devices: [],
    total: 0,
    loading: true,
    error: null,
    stats: null,
  });

  const fetchDevices = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params[key] = String(value);
      });

      const response = await devicesApi.list(Object.keys(params).length ? params : undefined);
      setState({
        devices: response.data,
        total: response.total,
        stats: response.stats as DeviceStats,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch devices";
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [filters]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const updateFilters = useCallback((newFilters: Partial<DeviceFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    refetch: fetchDevices,
  };
}

export function useDevice(deviceId: string) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = useCallback(async () => {
    if (!deviceId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await devicesApi.get(deviceId);
      setDevice(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch device";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDevice();
  }, [fetchDevice]);

  return { device, loading, error, refetch: fetchDevice };
}
