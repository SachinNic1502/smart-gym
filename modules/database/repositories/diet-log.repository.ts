
/**
 * Diet Log Repository
 */

import { getStore } from "../store";
import { connectToDatabase } from "../mongoose";
import { DietLogModel } from "../models";
import { generateId, formatDate } from "./base.repository";
import type { DietLog } from "@/lib/types";

export interface DietLogFilters {
    memberId: string;
    date?: string; // YYYY-MM-DD
    startDate?: string;
    endDate?: string;
    type?: "food" | "water";
}

export const dietLogRepository = {
    findAll(filters: DietLogFilters): DietLog[] {
        let logs = [...getStore().dietLogs].filter(l => l.memberId === filters.memberId);

        if (filters.date) {
            logs = logs.filter(l => l.date === filters.date);
        }

        if (filters.startDate) {
            logs = logs.filter(l => l.date >= filters.startDate!);
        }

        if (filters.endDate) {
            logs = logs.filter(l => l.date <= filters.endDate!);
        }

        if (filters.type) {
            logs = logs.filter(l => l.type === filters.type);
        }

        return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    create(data: Omit<DietLog, "id" | "createdAt" | "updatedAt">): DietLog {
        const now = formatDate();
        const log: DietLog = {
            ...data,
            id: generateId("DLG"),
            createdAt: now,
        };
        getStore().dietLogs.push(log);
        return log;
    },

    delete(id: string): boolean {
        const store = getStore();
        const index = store.dietLogs.findIndex(l => l.id === id);
        if (index === -1) return false;
        store.dietLogs.splice(index, 1);
        return true;
    },

    // ============================================
    // Mongo-backed async methods
    // ============================================

    async findAllAsync(filters: DietLogFilters): Promise<DietLog[]> {
        await connectToDatabase();

        const query: Record<string, unknown> = { memberId: filters.memberId };

        if (filters.date) {
            query.date = filters.date;
        }

        if (filters.startDate || filters.endDate) {
            query.date = {};
            if (filters.startDate) (query.date as any).$gte = filters.startDate;
            if (filters.endDate) (query.date as any).$lte = filters.endDate;
        }

        if (filters.type) {
            query.type = filters.type;
        }

        const logs = await DietLogModel.find(query)
            .sort({ createdAt: -1 })
            .lean<DietLog[]>();

        return logs;
    },

    async createAsync(data: Omit<DietLog, "id" | "createdAt" | "updatedAt">): Promise<DietLog> {
        await connectToDatabase();
        const now = formatDate();
        const log: DietLog = {
            ...data,
            id: generateId("DLG"),
            createdAt: now,
        };
        await DietLogModel.create(log);
        return log;
    },

    async deleteAsync(id: string): Promise<boolean> {
        await connectToDatabase();
        const res = await DietLogModel.deleteOne({ id }).exec();
        return res.deletedCount === 1;
    }
};
