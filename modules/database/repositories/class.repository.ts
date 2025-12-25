/**
 * Class Repository
 */

import { connectToDatabase } from "../mongoose";
import { GymClassModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { GymClass } from "@/lib/types";

export interface ClassFilters {
  branchId?: string;
  trainerId?: string;
  type?: string;
}

export const classRepository = {
  async findAllAsync(filters?: ClassFilters, pagination?: PaginationOptions): Promise<PaginatedResult<GymClass>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.branchId) query.branchId = filters.branchId;
    if (filters?.trainerId) query.trainerId = filters.trainerId;
    if (filters?.type) query.type = filters.type;

    const total = await GymClassModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await GymClassModel.find(query)
        .sort({ createdAt: -1 })
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

    const docs = await GymClassModel.find(query).sort({ createdAt: -1 }).lean<GymClass[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<GymClass | undefined> {
    await connectToDatabase();
    const doc = await GymClassModel.findOne({ id }).lean<GymClass | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<GymClass, "id" | "createdAt">): Promise<GymClass> {
    await connectToDatabase();
    const gymClass: GymClass = {
      ...data,
      id: generateId("CLS"),
      createdAt: formatDate(),
    };
    await GymClassModel.create(gymClass);
    return gymClass;
  },

  async updateAsync(id: string, data: Partial<GymClass>): Promise<GymClass | undefined> {
    await connectToDatabase();
    const doc = await GymClassModel.findOneAndUpdate(
      { id },
      { ...data },
      { new: true }
    ).lean<GymClass | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await GymClassModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },
};
