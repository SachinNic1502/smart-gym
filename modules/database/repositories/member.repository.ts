/**
 * Member Repository
 */

import { connectToDatabase } from "../mongoose";
import { MemberModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Member } from "@/lib/types";

export interface MemberFilters {
  branchId?: string;
  status?: string;
  plan?: string;
  search?: string;
}

export const memberRepository = {
  async findAllAsync(filters?: MemberFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Member>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};

    if (filters?.branchId) {
      query.branchId = filters.branchId;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.plan) {
      query.plan = { $regex: filters.plan, $options: "i" };
    }
    if (filters?.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const total = await MemberModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const members = await MemberModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Member[]>();

      return {
        data: members,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const members = await MemberModel.find(query)
      .sort({ createdAt: -1 })
      .lean<Member[]>();

    return {
      data: members,
      total,
      page: 1,
      pageSize: members.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Member | undefined> {
    await connectToDatabase();
    const doc = await MemberModel.findOne({ id }).lean<Member | null>();
    return doc ?? undefined;
  },

  async findByEmailAsync(email: string): Promise<Member | undefined> {
    await connectToDatabase();
    const doc = await MemberModel.findOne({ email }).lean<Member | null>();
    return doc ?? undefined;
  },

  async findByPhoneAsync(phone: string): Promise<Member | undefined> {
    await connectToDatabase();
    const normalized = phone.replace(/\D/g, "");
    // Note: This is an expensive operation on large DBs, should use indexed fields
    const doc = await MemberModel.findOne({
      phone: { $regex: normalized.slice(-10) }
    }).lean<Member | null>();
    return doc ?? undefined;
  },

  async findByBranchAsync(branchId: string): Promise<Member[]> {
    await connectToDatabase();
    return MemberModel.find({ branchId }).lean<Member[]>();
  },

  async createAsync(data: Omit<Member, "id" | "createdAt" | "updatedAt">): Promise<Member> {
    await connectToDatabase();
    const now = formatDate();
    const member: Member = {
      ...data,
      id: generateId("MEM"),
      createdAt: now,
      updatedAt: now,
    };
    await MemberModel.create(member);
    return member;
  },

  async updateAsync(id: string, data: Partial<Member>): Promise<Member | undefined> {
    await connectToDatabase();
    const updated = await MemberModel.findOneAndUpdate(
      { id },
      { ...data, id, updatedAt: formatDate() },
      { new: true },
    ).lean<Member | null>();
    return updated ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await MemberModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async updateProgramsAsync(id: string, workoutPlanId?: string, dietPlanId?: string): Promise<Member | undefined> {
    return this.updateAsync(id, { workoutPlanId, dietPlanId });
  },

  async getExpiringSoonAsync(branchId: string, days: number = 7): Promise<Member[]> {
    await connectToDatabase();
    const future = new Date();
    future.setDate(future.getDate() + days);
    const docs = await MemberModel.find({
      branchId,
      status: "Active",
      expiryDate: { $lte: future.toISOString() }
    }).lean<Member[]>();
    return docs;
  },

  async getExpiringTodayAsync(branchId: string): Promise<Member[]> {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    return MemberModel.find({
      branchId,
      expiryDate: { $regex: `^${today}` }
    }).lean<Member[]>();
  },
};
