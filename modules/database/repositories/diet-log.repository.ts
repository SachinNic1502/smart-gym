/**
 * Diet Log Repository
 */

import { connectToDatabase } from "../mongoose";
import { DietLogModel } from "../models";
import { generateId, formatDate, paginate, type PaginationOptions, type PaginatedResult } from "./base.repository";
import type { DietLog } from "@/lib/types";

export interface DietLogFilters {
    memberId?: string;
    date?: string;
}

export const dietLogRepository = {
    async findAllAsync(filters?: DietLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<DietLog>> {
        await connectToDatabase();

        const query: Record<string, unknown> = {};
        if (filters?.memberId) query.memberId = filters.memberId;
        if (filters?.date) query.date = filters.date;

        const total = await DietLogModel.countDocuments(query).exec();

        if (pagination) {
            const { page, pageSize } = pagination;
            const docs = await DietLogModel.find(query)
                .sort({ date: -1, createdAt: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean<DietLog[]>();

            return {
                data: docs,
                total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }

        const docs = await DietLogModel.find(query).sort({ date: -1 }).lean<DietLog[]>();
        return {
            data: docs,
            total,
            page: 1,
            pageSize: docs.length,
            totalPages: 1,
        };
    },

    async createAsync(data: Omit<DietLog, "id" | "createdAt">): Promise<DietLog> {
        await connectToDatabase();
        const log: DietLog = {
            ...data,
            id: generateId("DLG"),
            createdAt: formatDate(),
        };
        await DietLogModel.create(log);
        return log;
    },

    async deleteAsync(id: string): Promise<boolean> {
        await connectToDatabase();
        const res = await DietLogModel.deleteOne({ id }).exec();
        return res.deletedCount === 1;
    },
};
