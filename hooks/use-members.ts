/**
 * Members Hooks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { membersApi, ApiError } from "@/lib/api/client";
import type { Member } from "@/lib/types";

interface MembersState {
  members: Member[];
  total: number;
  loading: boolean;
  error: string | null;
}

interface MembersFilters {
  branchId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useMembers(initialFilters?: MembersFilters) {
  const [filters, setFilters] = useState<MembersFilters>(initialFilters || {});
  const [state, setState] = useState<MembersState>({
    members: [],
    total: 0,
    loading: true,
    error: null,
  });

  const fetchMembers = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await membersApi.list(filters as Record<string, string | number | undefined>);
      setState({
        members: response.data,
        total: response.total,
        loading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch members";
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, [filters]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const updateFilters = useCallback((newFilters: Partial<MembersFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    ...state,
    filters,
    updateFilters,
    refetch: fetchMembers,
  };
}

export function useMember(memberId: string) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMember = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await membersApi.get(memberId);
        setMember(response);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "Failed to fetch member";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  const updateMember = useCallback(async (data: Partial<Member>) => {
    try {
      const updated = await membersApi.update(memberId, data);
      setMember(updated);
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to update member";
      return { success: false, error: message };
    }
  }, [memberId]);

  const deleteMember = useCallback(async () => {
    try {
      await membersApi.delete(memberId);
      return { success: true };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete member";
      return { success: false, error: message };
    }
  }, [memberId]);

  return { member, loading, error, updateMember, deleteMember };
}

export function useCreateMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMember = useCallback(async (data: Partial<Member>) => {
    setLoading(true);
    setError(null);
    try {
      const member = await membersApi.create(data);
      setLoading(false);
      return { success: true, data: member };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to create member";
      setError(message);
      setLoading(false);
      return { success: false, error: message };
    }
  }, []);

  return { createMember, loading, error };
}
