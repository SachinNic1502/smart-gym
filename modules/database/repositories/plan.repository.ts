/**
 * Plan Repository
 */

import { connectToDatabase } from "../mongoose";
import { MembershipPlanModel, WorkoutPlanModel, DietPlanModel } from "../models";
import { generateId, paginate, formatDate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { MembershipPlan, WorkoutPlan, DietPlan } from "@/lib/types";

export const planRepository = {
  // ... existing methods ...

  async findAllAsync(filters?: { isActive?: boolean }, pagination?: PaginationOptions): Promise<PaginatedResult<MembershipPlan>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const docs = await MembershipPlanModel.find(query).sort({ price: 1 }).lean<MembershipPlan[]>();

    if (pagination) {
      return paginate(docs, pagination);
    }

    return {
      data: docs,
      total: docs.length,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<MembershipPlan | undefined> {
    await connectToDatabase();
    const doc = await MembershipPlanModel.findOne({ id }).lean<MembershipPlan | null>();
    return doc ?? undefined;
  },

  async findWorkoutPlanByIdAsync(id: string): Promise<WorkoutPlan | undefined> {
    await connectToDatabase();
    const doc = await WorkoutPlanModel.findOne({ id }).lean<WorkoutPlan | null>();
    return doc ?? undefined;
  },

  async findDietPlanByIdAsync(id: string): Promise<DietPlan | undefined> {
    await connectToDatabase();
    const doc = await DietPlanModel.findOne({ id }).lean<DietPlan | null>();
    return doc ?? undefined;
  },

  async findAllWorkoutPlansAsync(): Promise<WorkoutPlan[]> {
    await connectToDatabase();
    return await WorkoutPlanModel.find().lean<WorkoutPlan[]>();
  },

  async findAllDietPlansAsync(): Promise<DietPlan[]> {
    await connectToDatabase();
    return await DietPlanModel.find().lean<DietPlan[]>();
  },

  async createAsync(data: Omit<MembershipPlan, "id">): Promise<MembershipPlan> {
    await connectToDatabase();
    const plan: MembershipPlan = {
      ...data,
      id: generateId("PLN"),
    };
    await MembershipPlanModel.create(plan);
    return plan;
  },

  async createWorkoutPlanAsync(data: Omit<WorkoutPlan, "id" | "createdAt">): Promise<WorkoutPlan> {
    await connectToDatabase();
    const plan: WorkoutPlan = {
      ...data,
      id: generateId("WP"),
      createdAt: formatDate(),
    };
    await WorkoutPlanModel.create(plan);
    return plan;
  },

  async createDietPlanAsync(data: Omit<DietPlan, "id" | "createdAt">): Promise<DietPlan> {
    await connectToDatabase();
    const plan: DietPlan = {
      ...data,
      id: generateId("DP"),
      createdAt: formatDate(),
    };
    await DietPlanModel.create(plan);
    return plan;
  },

  async updateAsync(id: string, data: Partial<MembershipPlan>): Promise<MembershipPlan | undefined> {
    await connectToDatabase();
    const doc = await MembershipPlanModel.findOneAndUpdate(
      { id },
      { ...data },
      { new: true }
    ).lean<MembershipPlan | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await MembershipPlanModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },
};
