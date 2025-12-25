/**
 * Communication Repository
 */

import { connectToDatabase } from "../mongoose";
import { CommunicationModel } from "../models";
import { generateId, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { BroadcastMessage } from "@/lib/types";

export const communicationRepository = {
  async findAllAsync(filters?: { channel?: string; status?: string }, pagination?: PaginationOptions): Promise<PaginatedResult<BroadcastMessage>> {
    await connectToDatabase();

    const query: Record<string, unknown> = {};
    if (filters?.channel) query.channel = filters.channel;
    if (filters?.status) query.status = filters.status;

    const total = await CommunicationModel.countDocuments(query).exec();

    if (pagination) {
      const { page, pageSize } = pagination;
      const docs = await CommunicationModel.find(query)
        .sort({ sentAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<BroadcastMessage[]>();

      return {
        data: docs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }

    const docs = await CommunicationModel.find(query).sort({ sentAt: -1 }).lean<BroadcastMessage[]>();
    return {
      data: docs,
      total,
      page: 1,
      pageSize: docs.length,
      totalPages: 1,
    };
  },

  async createAsync(data: Omit<BroadcastMessage, "id">): Promise<BroadcastMessage> {
    await connectToDatabase();
    const message: BroadcastMessage = {
      ...data,
      id: generateId("COM"),
    };
    await CommunicationModel.create(message);
    return message;
  },
};
