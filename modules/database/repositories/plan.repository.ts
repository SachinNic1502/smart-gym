/**
 * Plan Repository (Membership, Workout, Diet)
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { DietPlanModel, MembershipPlanModel, WorkoutPlanModel } from "../models";
import { generateId } from "./base.repository";
import type { MembershipPlan, WorkoutPlan, DietPlan } from "@/lib/types";

export const planRepository = {
  // Membership Plans
  findAllMembershipPlans(activeOnly: boolean = true): MembershipPlan[] {
    const plans = getStore().plans;
    return activeOnly ? plans.filter(p => p.isActive) : plans;
  },

  findMembershipPlanById(id: string): MembershipPlan | undefined {
    return getStore().plans.find(p => p.id === id);
  },

  async findAllMembershipPlansAsync(activeOnly: boolean = true): Promise<MembershipPlan[]> {
    try {
      await connectToDatabase();
      const query: Record<string, unknown> = {};
      if (activeOnly) query.isActive = true;

      const docs = await MembershipPlanModel.find(query).sort({ price: 1 }).lean<MembershipPlan[]>();
      return docs;
    } catch {
      return this.findAllMembershipPlans(activeOnly);
    }
  },

  async findMembershipPlanByIdAsync(id: string): Promise<MembershipPlan | undefined> {
    try {
      await connectToDatabase();
      const doc = await MembershipPlanModel.findOne({ id }).lean<MembershipPlan | null>();
      return doc ?? undefined;
    } catch {
      return this.findMembershipPlanById(id);
    }
  },

  async createMembershipPlanAsync(
    data: Omit<MembershipPlan, "id">
  ): Promise<MembershipPlan> {
    const plan: MembershipPlan = {
      ...data,
      id: generateId("PLN"),
    };

    try {
      await connectToDatabase();
      await MembershipPlanModel.create(plan);
      return plan;
    } catch {
      getStore().plans.unshift(plan);
    }

    return plan;
  },

  async updateMembershipPlanAsync(id: string, data: Partial<MembershipPlan>): Promise<MembershipPlan | undefined> {
    try {
      await connectToDatabase();
      const updated = await MembershipPlanModel.findOneAndUpdate(
        { id },
        { ...data, id },
        { new: true },
      ).lean<MembershipPlan | null>();
      return updated ?? undefined;
    } catch {
      const store = getStore();
      const idx = store.plans.findIndex(p => p.id === id);
      if (idx === -1) return undefined;
      store.plans[idx] = { ...store.plans[idx], ...data, id };
      return store.plans[idx];
    }
  },

  async deleteMembershipPlanAsync(id: string): Promise<boolean> {
    try {
      await connectToDatabase();
      const res = await MembershipPlanModel.deleteOne({ id }).exec();
      return res.deletedCount === 1;
    } catch {
      const store = getStore();
      const idx = store.plans.findIndex(p => p.id === id);
      if (idx !== -1) {
        store.plans.splice(idx, 1);
        return true;
      }
      return false;
    }
  },

  // Workout Plans
  findAllWorkoutPlans(): WorkoutPlan[] {
    return getStore().workoutPlans;
  },

  findWorkoutPlanById(id: string): WorkoutPlan | undefined {
    return getStore().workoutPlans.find(p => p.id === id);
  },

  async findAllWorkoutPlansAsync(): Promise<WorkoutPlan[]> {
    try {
      await connectToDatabase();
      const docs = await WorkoutPlanModel.find({}).sort({ createdAt: -1 }).lean<WorkoutPlan[]>();
      return docs;
    } catch {
      return this.findAllWorkoutPlans();
    }
  },

  async findWorkoutPlanByIdAsync(id: string): Promise<WorkoutPlan | undefined> {
    try {
      await connectToDatabase();
      const doc = await WorkoutPlanModel.findOne({ id }).lean<WorkoutPlan | null>();
      return doc ?? undefined;
    } catch {
      return this.findWorkoutPlanById(id);
    }
  },

  async createWorkoutPlanAsync(
    data: Omit<WorkoutPlan, "id" | "createdAt">
  ): Promise<WorkoutPlan> {
    const plan: WorkoutPlan = {
      ...data,
      id: generateId("WKP"),
      createdAt: new Date().toISOString(),
    };

    try {
      await connectToDatabase();
      await WorkoutPlanModel.create(plan);
      return plan;
    } catch {
      getStore().workoutPlans.unshift(plan);
    }

    return plan;
  },

  // Diet Plans
  findAllDietPlans(): DietPlan[] {
    return getStore().dietPlans;
  },

  findDietPlanById(id: string): DietPlan | undefined {
    return getStore().dietPlans.find(p => p.id === id);
  },

  async findAllDietPlansAsync(): Promise<DietPlan[]> {
    try {
      await connectToDatabase();
      const docs = await DietPlanModel.find({}).sort({ createdAt: -1 }).lean<DietPlan[]>();
      return docs;
    } catch {
      return this.findAllDietPlans();
    }
  },

  async findDietPlanByIdAsync(id: string): Promise<DietPlan | undefined> {
    try {
      await connectToDatabase();
      const doc = await DietPlanModel.findOne({ id }).lean<DietPlan | null>();
      return doc ?? undefined;
    } catch {
      return this.findDietPlanById(id);
    }
  },

  async createDietPlanAsync(
    data: Omit<DietPlan, "id" | "createdAt">
  ): Promise<DietPlan> {
    const plan: DietPlan = {
      ...data,
      id: generateId("DTP"),
      createdAt: new Date().toISOString(),
    };

    try {
      await connectToDatabase();
      await DietPlanModel.create(plan);
      return plan;
    } catch {
      getStore().dietPlans.unshift(plan);
    }

    return plan;
  },
};
