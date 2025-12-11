/**
 * Branches Hooks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { branchesApi, ApiError } from "@/lib/api/client";
import type { Branch } from "@/lib/types";

interface BranchesState {
  branches: Branch[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface BranchesFilters {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useBranches(initialFilters?: BranchesFilters) {
  const [filters, setFilters] = useState<BranchesFilters>(initialFilters || {});
  const [state, setState] = useState<BranchesState>({
    branches: [],
    total: 0,
    loading: true,
    error: null,
  });

  const fetchBranches = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await branchesApi.list(filters as Record<string, string | undefined>);
      setState({
        branches: response.data,
        total: response.total,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch branches";
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [filters]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const updateFilters = useCallback((newFilters: Partial<BranchesFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    refetch: fetchBranches,
  };
}

export function useBranch(branchId: string) {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranch = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await branchesApi.get(branchId);
        setBranch(response);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to fetch branch";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (branchId) {
      fetchBranch();
    }
  }, [branchId]);

  const updateBranch = useCallback(async (data: Partial<Branch>) => {
    try {
      const updated = await branchesApi.update(branchId, data);
      setBranch(updated);
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update branch";
      return { success: false, error: message };
    }
  }, [branchId]);

  return { branch, loading, error, updateBranch };
}
