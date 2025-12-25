import { connectToDatabase } from "../mongoose";
import { BranchModel, MemberModel, DeviceModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { Branch } from "@/lib/types";

export interface BranchFilters {
  status?: string;
  search?: string;
}

export const branchRepository = {
  async findAllAsync(filters?: BranchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Branch>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.search) {
      const search = filters.search;
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const docs = await BranchModel.find(query).sort({ name: 1 }).lean<Branch[]>();

    // Enrich with dynamic counts
    const enrichedDocs = await Promise.all(docs.map(async (branch) => {
      const [memberCount, deviceCount] = await Promise.all([
        MemberModel.countDocuments({ branchId: branch.id }),
        DeviceModel.countDocuments({ branchId: branch.id })
      ]);
      return { ...branch, memberCount, deviceCount };
    }));

    if (pagination) {
      return paginate(enrichedDocs, pagination);
    }

    return {
      data: enrichedDocs,
      total: enrichedDocs.length,
      page: 1,
      pageSize: enrichedDocs.length,
      totalPages: 1,
    };
  },

  async findByIdAsync(id: string): Promise<Branch | undefined> {
    await connectToDatabase();
    const doc = await BranchModel.findOne({ id }).lean<Branch | null>();
    if (!doc) return undefined;

    const [memberCount, deviceCount] = await Promise.all([
      MemberModel.countDocuments({ branchId: id }),
      DeviceModel.countDocuments({ branchId: id })
    ]);

    return { ...doc, memberCount, deviceCount };
  },

  async findByNameAsync(name: string): Promise<Branch | undefined> {
    await connectToDatabase();
    const doc = await BranchModel.findOne({ name }).lean<Branch | null>();
    return doc ?? undefined;
  },

  async createAsync(data: Omit<Branch, "id" | "createdAt" | "updatedAt" | "memberCount" | "deviceCount">): Promise<Branch> {
    await connectToDatabase();
    const now = formatDate();
    const branch: Branch = {
      ...data,
      id: generateId("BRN"),
      memberCount: 0,
      deviceCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await BranchModel.create(branch);
    return branch;
  },

  async updateAsync(id: string, data: Partial<Branch>): Promise<Branch | undefined> {
    await connectToDatabase();
    const doc = await BranchModel.findOneAndUpdate(
      { id },
      { ...data, id, updatedAt: formatDate() },
      { new: true },
    ).lean<Branch | null>();
    return doc ?? undefined;
  },

  async deleteAsync(id: string): Promise<boolean> {
    await connectToDatabase();
    const res = await BranchModel.deleteOne({ id }).exec();
    return res.deletedCount === 1;
  },

  async getMemberCountAsync(id: string): Promise<number> {
    await connectToDatabase();
    return await MemberModel.countDocuments({ branchId: id }).exec();
  },
};
