
import { dietLogRepository } from "../database/repositories";
import type { DietLog } from "@/lib/types";

export interface CreateDietLogDTO {
    memberId: string;
    type: "food" | "water";
    calories?: number;
    waterMl?: number;
    label?: string;
    date?: string; // Optional, defaults to today
}

export interface DaySummary {
    date: string;
    caloriesConsumed: number;
    waterConsumed: number; // liters
    logs: DietLog[];
}

export const dietService = {
    /**
     * Log a new entry
     */
    async logEntry(dto: CreateDietLogDTO): Promise<DietLog> {
        const today = new Date().toISOString().split("T")[0];
        const date = dto.date || today;

        return dietLogRepository.createAsync({
            memberId: dto.memberId,
            date,
            type: dto.type,
            calories: dto.calories,
            waterMl: dto.waterMl,
            label: dto.label,
        });
    },

    /**
     * Get summary for a specific day
     */
    async getDaySummary(memberId: string, date?: string): Promise<DaySummary> {
        const targetDate = date || new Date().toISOString().split("T")[0];

        const logs = await dietLogRepository.findAllAsync({
            memberId,
            date: targetDate,
        });

        const caloriesConsumed = logs
            .filter(l => l.type === "food")
            .reduce((sum, l) => sum + (l.calories || 0), 0);

        const waterMl = logs
            .filter(l => l.type === "water")
            .reduce((sum, l) => sum + (l.waterMl || 0), 0);

        return {
            date: targetDate,
            caloriesConsumed,
            waterConsumed: parseFloat((waterMl / 1000).toFixed(2)), // return in liters
            logs,
        };
    },

    /**
     * Delete a log entry
     */
    async deleteEntry(id: string): Promise<boolean> {
        return dietLogRepository.deleteAsync(id);
    }
};
