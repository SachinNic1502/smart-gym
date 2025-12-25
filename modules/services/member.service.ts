/**
 * Member Service
 */

import { memberRepository, planRepository } from "@/modules/database";
import type { Member } from "@/lib/types";
import type { MemberFilters, PaginationOptions, PaginatedResult } from "@/modules/database";

export interface CreateMemberData {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  address?: string;
  branchId: string;
  planId?: string;
  referralSource?: string;
  notes?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const memberService = {
  /**
   * Get all members with filters and pagination
   */
  async getMembers(filters?: MemberFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Member>> {
    return memberRepository.findAllAsync(filters, pagination);
  },

  /**
   * Get a single member by ID
   */
  async getMember(id: string): Promise<ServiceResult<Member>> {
    const member = await memberRepository.findByIdAsync(id);
    if (!member) {
      return { success: false, error: "Member not found" };
    }
    return { success: true, data: member };
  },

  /**
   * Create a new member
   */
  async createMember(data: CreateMemberData): Promise<ServiceResult<Member>> {
    // Check for duplicate email
    if (data.email) {
      const existingEmail = await memberRepository.findByEmailAsync(data.email);
      if (existingEmail) {
        return { success: false, error: "A member with this email already exists" };
      }
    }

    // Check for duplicate phone
    const existingPhone = await memberRepository.findByPhoneAsync(data.phone);
    if (existingPhone) {
      return { success: false, error: "A member with this phone number already exists" };
    }

    // Resolve membership plan (optional)
    const selectedPlan = data.planId ? await planRepository.findByIdAsync(data.planId) : undefined;
    if (data.planId && !selectedPlan) {
      return { success: false, error: "Membership plan not found" };
    }

    const now = Date.now();
    const durationDays = selectedPlan?.durationDays ?? 30;
    const expiryDate = new Date(now + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Create member with default values
    const member = await memberRepository.createAsync({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      plan: selectedPlan?.name ?? "Standard",
      status: "Active",
      expiryDate,
      branchId: data.branchId,
      referralSource: data.referralSource,
      notes: data.notes,
    });

    return { success: true, data: member };
  },

  /**
   * Update a member
   */
  async updateMember(id: string, data: Partial<Member>): Promise<ServiceResult<Member>> {
    const member = await memberRepository.updateAsync(id, data);
    if (!member) {
      return { success: false, error: "Member not found" };
    }
    return { success: true, data: member };
  },

  /**
   * Delete a member
   */
  async deleteMember(id: string): Promise<ServiceResult<{ id: string }>> {
    const deleted = await memberRepository.deleteAsync(id);
    if (!deleted) {
      return { success: false, error: "Member not found" };
    }
    return { success: true, data: { id } };
  },

  /**
   * Get member's assigned programs
   */
  async getMemberPrograms(id: string) {
    const member = await memberRepository.findByIdAsync(id);
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    const workoutPlan = member.workoutPlanId
      ? await planRepository.findWorkoutPlanByIdAsync(member.workoutPlanId)
      : null;

    const dietPlan = member.dietPlanId
      ? await planRepository.findDietPlanByIdAsync(member.dietPlanId)
      : null;

    return {
      success: true,
      data: {
        memberId: member.id,
        memberName: member.name,
        workoutPlan,
        dietPlan,
      },
    };
  },

  /**
   * Assign programs to a member
   */
  async assignPrograms(id: string, workoutPlanId?: string, dietPlanId?: string): Promise<ServiceResult<Member>> {
    // Validate workout plan if provided
    if (workoutPlanId) {
      const plan = await planRepository.findWorkoutPlanByIdAsync(workoutPlanId);
      if (!plan) {
        return { success: false, error: "Workout plan not found" };
      }
    }

    // Validate diet plan if provided
    if (dietPlanId) {
      const plan = await planRepository.findDietPlanByIdAsync(dietPlanId);
      if (!plan) {
        return { success: false, error: "Diet plan not found" };
      }
    }

    const member = await memberRepository.updateProgramsAsync(id, workoutPlanId, dietPlanId);
    if (!member) {
      return { success: false, error: "Member not found" };
    }

    return { success: true, data: member };
  },

  /**
   * Get members expiring soon
   */
  async getExpiringSoon(branchId: string, days: number = 7): Promise<Member[]> {
    return memberRepository.getExpiringSoonAsync(branchId, days);
  },

  /**
   * Freeze a member's membership
   */
  async freezeMember(id: string, reason?: string): Promise<ServiceResult<Member>> {
    const member = await memberRepository.findByIdAsync(id);
    if (!member) return { success: false, error: "Member not found" };
    if (member.status === "Frozen") return { success: false, error: "Member is already frozen" };

    const updated = await memberRepository.updateAsync(id, {
      status: "Frozen",
      notes: reason ? `${member.notes || ""}\n[Freezed] ${new Date().toLocaleDateString()}: ${reason}` : member.notes
    });

    if (!updated) return { success: false, error: "Failed to freeze member" };
    return { success: true, data: updated };
  },

  /**
   * Unfreeze a member's membership
   */
  async unfreezeMember(id: string): Promise<ServiceResult<Member>> {
    const member = await memberRepository.findByIdAsync(id);
    if (!member) return { success: false, error: "Member not found" };
    if (member.status !== "Frozen") return { success: false, error: "Member is not frozen" };

    const updated = await memberRepository.updateAsync(id, {
      status: "Active",
      notes: `${member.notes || ""}\n[Unfreezed] ${new Date().toLocaleDateString()}`
    });

    if (!updated) return { success: false, error: "Failed to unfreeze member" };
    return { success: true, data: updated };
  },
};

