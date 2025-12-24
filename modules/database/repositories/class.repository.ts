/**
 * Class Repository
 */

import { getStore, persistStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { GymClassModel } from "../models";
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
    persistStore();
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
    persistStore();
    return store.classes[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.classes.findIndex(c => c.id === id);
    if (index === -1) return false;
    store.classes.splice(index, 1);
    persistStore();
    return true;
  },

  enroll(classId: string): boolean {
    const store = getStore();
    const gymClass = store.classes.find(c => c.id === classId);
    if (!gymClass || gymClass.enrolled >= gymClass.capacity) return false;
    gymClass.enrolled++;
    persistStore();
    return true;
  },

  unenroll(classId: string): boolean {
    const store = getStore();
    const gymClass = store.classes.find(c => c.id === classId);
    if (!gymClass || gymClass.enrolled <= 0) return false;
    gymClass.enrolled--;
    persistStore();
    return true;
  },

  getActiveByBranch(branchId: string): GymClass[] {
    return getStore().classes.filter(c => c.branchId === branchId && c.status === "active");
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

  async findAllAsync(filters: ClassFilters = {}, pagination?: PaginationOptions): Promise<PaginatedResult<GymClass>> {
    try {
      await connectToDatabase();
    } catch {
      return this.findAll(filters, pagination);
    }

    const query: Record<string, unknown> = {};
    if (filters.branchId) query.branchId = filters.branchId;
    if (filters.trainerId) query.trainerId = filters.trainerId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;

    const total = await GymClassModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await GymClassModel.find(query)
        .sort({ name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<GymClass[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await GymClassModel.find(query).sort({ name: 1 }).lean<GymClass[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<GymClass | undefined> {
    try {
      await connectToDatabase();
    } catch {
      return this.findById(id);
    }
    const doc = await GymClassModel.findOne({ id }).lean<GymClass | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<GymClass, "id" | "createdAt" | "enrolled">): Promise<GymClass> {
    const gymClass = this.create(data);

    try {
      await connectToDatabase();
      await GymClassModel.create(gymClass);
    } catch {
      // ignore and keep in-memory
    }

    return gymClass;
  },

  async updateAsync(id: string, data: Partial<GymClass>): Promise<GymClass | null> {
    const updated = this.update(id, data);

    try {
      await connectToDatabase();
      const doc = await GymClassModel.findOneAndUpdate(
        { id },
        { ...data, id },
        { new: true },
      ).lean<GymClass | null>();
      return doc ?? updated;
    } catch {
      return updated;
    }
  },

  async deleteAsync(id: string): Promise<boolean> {
    const deleted = this.delete(id);
    try {
      await connectToDatabase();
      const res = await GymClassModel.deleteOne({ id }).exec();
      return res.deletedCount === 1;
    } catch {
      return deleted;
    }
  },

  async enrollAsync(classId: string): Promise<boolean> {
    const ok = this.enroll(classId);
    try {
      await connectToDatabase();
      await GymClassModel.updateOne({ id: classId }, { $inc: { enrolled: 1 } }).exec();
      return true;
    } catch {
      return ok;
    }
  },

  async unenrollAsync(classId: string): Promise<boolean> {
    const ok = this.unenroll(classId);
    try {
      await connectToDatabase();
      await GymClassModel.updateOne({ id: classId }, { $inc: { enrolled: -1 } }).exec();
      return true;
    } catch {
      return ok;
    }
  },

  async getActiveByBranchAsync(branchId: string): Promise<GymClass[]> {
    try {
      await connectToDatabase();
    } catch {
      return this.getActiveByBranch(branchId);
    }

    return GymClassModel.find({ branchId, status: "active" }).sort({ name: 1 }).lean<GymClass[]>();
  },
};
