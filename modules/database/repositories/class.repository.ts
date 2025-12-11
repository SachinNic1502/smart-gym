/**
 * Class Repository
 */

import { getStore } from "../store";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { GymClass, ClassType } from "@/lib/types";

export interface ClassFilters {
  branchId?: string;
  trainerId?: string;
  type?: ClassType;
  status?: "active" | "cancelled" | "completed";
}

export const classRepository = {
  findAll(filters: ClassFilters = {}, pagination?: PaginationOptions): PaginatedResult<GymClass> {
    const store = getStore();
    let filtered = [...store.classes];

    if (filters.branchId) {
      filtered = filtered.filter(c => c.branchId === filters.branchId);
    }

    if (filters.trainerId) {
      filtered = filtered.filter(c => c.trainerId === filters.trainerId);
    }

    if (filters.type) {
      filtered = filtered.filter(c => c.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Sort by name
    filtered.sort((a, b) => a.name.localeCompare(b.name));

    return paginate(filtered, pagination);
  },

  findById(id: string): GymClass | undefined {
    return getStore().classes.find(c => c.id === id);
  },

  create(data: Omit<GymClass, "id" | "createdAt" | "enrolled">): GymClass {
    const store = getStore();
    const gymClass: GymClass = {
      ...data,
      id: generateId("CLS"),
      enrolled: 0,
      createdAt: formatDate(new Date()),
    };
    store.classes.push(gymClass);
    return gymClass;
  },

  update(id: string, data: Partial<GymClass>): GymClass | null {
    const store = getStore();
    const index = store.classes.findIndex(c => c.id === id);
    if (index === -1) return null;

    store.classes[index] = {
      ...store.classes[index],
      ...data,
      id,
    };
    return store.classes[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.classes.findIndex(c => c.id === id);
    if (index === -1) return false;
    store.classes.splice(index, 1);
    return true;
  },

  enroll(classId: string): boolean {
    const store = getStore();
    const gymClass = store.classes.find(c => c.id === classId);
    if (!gymClass || gymClass.enrolled >= gymClass.capacity) return false;
    gymClass.enrolled++;
    return true;
  },

  unenroll(classId: string): boolean {
    const store = getStore();
    const gymClass = store.classes.find(c => c.id === classId);
    if (!gymClass || gymClass.enrolled <= 0) return false;
    gymClass.enrolled--;
    return true;
  },

  getActiveByBranch(branchId: string): GymClass[] {
    return getStore().classes.filter(c => c.branchId === branchId && c.status === "active");
  },
};
