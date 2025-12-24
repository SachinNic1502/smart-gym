/**
 * Member Repository
 */

import { getStore, persistStore } from "../store";
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
  findAll(filters?: MemberFilters, pagination?: PaginationOptions): PaginatedResult<Member> {
    let members = [...getStore().members];

    if (filters) {
      if (filters.branchId) {
        members = members.filter(m => m.branchId === filters.branchId);
      }
      if (filters.status) {
        members = members.filter(m => m.status === filters.status);
      }
      if (filters.plan) {
        members = members.filter(m => m.plan.toLowerCase().includes(filters.plan!.toLowerCase()));
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        members = members.filter(m =>
          m.name.toLowerCase().includes(search) ||
          m.email.toLowerCase().includes(search) ||
          m.phone.includes(search)
        );
      }
    }

    // Sort by most recent
    members.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (pagination) {
      return paginate(members, pagination);
    }

    return {
      data: members,
      total: members.length,
      page: 1,
      pageSize: members.length,
      totalPages: 1,
    };
  },

  findById(id: string): Member | undefined {
    return getStore().members.find(m => m.id === id);
  },

  findByEmail(email: string): Member | undefined {
    return getStore().members.find(m => m.email.toLowerCase() === email.toLowerCase());
  },

  findByPhone(phone: string): Member | undefined {
    const normalized = phone.replace(/\D/g, "");
    return getStore().members.find(m => m.phone.replace(/\D/g, "") === normalized);
  },

  findByBranch(branchId: string): Member[] {
    return getStore().members.filter(m => m.branchId === branchId);
  },

  create(data: Omit<Member, "id" | "createdAt" | "updatedAt">): Member {
    const now = formatDate();
    const member: Member = {
      ...data,
      id: generateId("MEM"),
      createdAt: now,
      updatedAt: now,
    };
    getStore().members.push(member);
    persistStore();
    return member;
  },

  update(id: string, data: Partial<Member>): Member | undefined {
    const store = getStore();
    const index = store.members.findIndex(m => m.id === id);
    if (index === -1) return undefined;

    store.members[index] = {
      ...store.members[index],
      ...data,
      id, // Prevent ID change
      updatedAt: formatDate(),
    };
    persistStore();
    return store.members[index];
  },

  delete(id: string): boolean {
    const store = getStore();
    const index = store.members.findIndex(m => m.id === id);
    if (index === -1) return false;
    store.members.splice(index, 1);
    persistStore();
    return true;
  },

  updatePrograms(id: string, workoutPlanId?: string, dietPlanId?: string): Member | undefined {
    return this.update(id, { workoutPlanId, dietPlanId });
  },

  getExpiringSoon(branchId: string, days: number = 7): Member[] {
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    return getStore().members.filter(
      m => m.branchId === branchId && m.status === "Active" && m.expiryDate <= futureDate
    );
  },

  getExpiringToday(branchId: string): Member[] {
    const today = new Date().toISOString().split("T")[0];
    return getStore().members.filter(
      m => m.branchId === branchId && m.expiryDate.startsWith(today)
    );
  },

  // ============================================
  // Mongo-backed async methods (real database)
  // ============================================

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
    const docs = await MemberModel.find().lean<Member[]>();
    const match = docs.find(m => m.phone.replace(/\D/g, "").endsWith(normalized.slice(-10)));
    return match ?? undefined;
  },

  async findByBranchAsync(branchId: string): Promise<Member[]> {
    await connectToDatabase();
    const docs = await MemberModel.find({ branchId }).lean<Member[]>();
    return docs;
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
    const docs = await MemberModel.find({ branchId, status: "Active" }).lean<Member[]>();
    return docs.filter(m => new Date(m.expiryDate) <= future);
  },

  async getExpiringTodayAsync(branchId: string): Promise<Member[]> {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    const docs = await MemberModel.find({ branchId }).lean<Member[]>();
    return docs.filter(m => m.expiryDate.startsWith(today));
  },
};
