/**
 * Diet Log Repository
 */

import { getStore, persistStore } from "../store";
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
        persistStore();
        return log;
    },

    delete(id: string): boolean {
        const store = getStore();
        const index = store.dietLogs.findIndex(l => l.id === id);
        if (index === -1) return false;
        store.dietLogs.splice(index, 1);
        persistStore();
        return true;
    },

    // ============================================
    // Mongo-backed async methods
    // ============================================

    async findAllAsync(filters: DietLogFilters): Promise<DietLog[]> {
        try {
            await connectToDatabase();
        } catch {
            return this.findAll(filters);
        }

        const query: Record<string, unknown> = { memberId: filters.memberId };

        if (filters.date) {
            query.date = filters.date;
        }

        if (filters.startDate || filters.endDate) {
            const dateQuery: Record<string, string> = {};
            if (filters.startDate) dateQuery.$gte = filters.startDate;
            if (filters.endDate) dateQuery.$lte = filters.endDate;
            query.date = dateQuery;
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
        const log = this.create(data);
        try {
            await connectToDatabase();
            await DietLogModel.create(log);
        } catch {
            // ignore
        }
        return log;
    },

    async deleteAsync(id: string): Promise<boolean> {
        const deleted = this.delete(id);
        try {
            await connectToDatabase();
            const res = await DietLogModel.deleteOne({ id }).exec();
            return res.deletedCount === 1;
        } catch {
            return deleted;
        }
    }
};
