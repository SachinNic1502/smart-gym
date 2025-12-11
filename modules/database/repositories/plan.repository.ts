/**
 * Plan Repository (Membership, Workout, Diet)
 */

import { getStore } from "../store";
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

  // Workout Plans
  findAllWorkoutPlans(): WorkoutPlan[] {
    return getStore().workoutPlans;
  },

  findWorkoutPlanById(id: string): WorkoutPlan | undefined {
    return getStore().workoutPlans.find(p => p.id === id);
  },

  // Diet Plans
  findAllDietPlans(): DietPlan[] {
    return getStore().dietPlans;
  },

  findDietPlanById(id: string): DietPlan | undefined {
    return getStore().dietPlans.find(p => p.id === id);
  },
};
