/**
 * Staff Repository
 */

import { getStore } from "../store";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Staff, StaffRole } from "@/lib/types";

export interface StaffFilters {
  branchId?: string;
  role?: StaffRole;
  status?: "active" | "inactive";
  search?: string;
}

export const staffRepository = {
  findAll(filters: StaffFilters = {}, pagination?: PaginationOptions): PaginatedResult<Staff> {
    const store = getStore();
    let filtered = [...store.staff];

    if (filters.branchId) {
      filtered = filtered.filter(s => s.branchId === filters.branchId);
    }

    if (filters.role) {
      filtered = filtered.filter(s => s.role === filters.role);
    }

    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.email.toLowerCase().includes(search) ||
        s.phone.includes(search)
      );
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return paginate(filtered, pagination);
  },

  findById(id: string): Staff | undefined {
    return getStore().staff.find(s => s.id === id);
  },

  findByEmail(email: string): Staff | undefined {
    return getStore().staff.find(s => s.email.toLowerCase() === email.toLowerCase());
  },

  create(data: Omit<Staff, "id" | "createdAt" | "updatedAt">): Staff {
    const store = getStore();
    const now = formatDate(new Date());
    const staff: Staff = {
      ...data,
      id: generateId("STF"),
      createdAt: now,
      updatedAt: now,
    };
    store.staff.push(staff);
    return staff;
  },

  update(id: string, data: Partial<Staff>): Staff | null {
    const store = getStore();
    const index = store.staff.findIndex(s => s.id === id);
    if (index === -1) return null;

    store.staff[index] = {
      ...store.staff[index],
      ...data,
      id,
      updatedAt: formatDate(new Date()),
    };
    return store.staff[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.staff.findIndex(s => s.id === id);
    if (index === -1) return false;
    store.staff.splice(index, 1);
    return true;
  },

  getCountByBranch(branchId: string): number {
    return getStore().staff.filter(s => s.branchId === branchId && s.status === "active").length;
  },

  getTrainers(branchId?: string): Staff[] {
    const store = getStore();
    return store.staff.filter(s => 
      s.role === "trainer" && 
      s.status === "active" &&
      (!branchId || s.branchId === branchId)
    );
  },
};
