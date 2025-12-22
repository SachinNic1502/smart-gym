
import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { dietService } from "@/modules/services";
import { requireSession } from "@/lib/api/require-auth";

// GET /api/me/diet-logs - Get today's logs and summary
export async function GET(request: NextRequest) {
    try {
        const auth = await requireSession(["member"]);
        if ("response" in auth) return auth.response;

        const { searchParams } = new URL(request.url);
        const date = searchParams.get("date") || undefined;

        const summary = await dietService.getDaySummary(auth.session.sub, date);
        return successResponse(summary);

    } catch (error) {
        console.error("Get diet logs error:", error);
        return errorResponse("Failed to fetch diet logs", 500);
    }
}

interface CreateLogRequest {
    type: "food" | "water";
    calories?: number;
    waterMl?: number;
    label?: string;
    date?: string;
}

// POST /api/me/diet-logs - Create a log entry
export async function POST(request: NextRequest) {
    try {
        const auth = await requireSession(["member"]);
        if ("response" in auth) return auth.response;

        const body = await parseBody<CreateLogRequest>(request);
        if (!body) return errorResponse("Invalid body");

        const { type, calories, waterMl, label, date } = body;

        if (!type) return errorResponse("Type is required");

        const log = await dietService.logEntry({
            memberId: auth.session.sub,
            type,
            calories,
            waterMl,
            label,
            date,
        });

        // Return updated summary immediately so frontend can update state easily
        const summary = await dietService.getDaySummary(auth.session.sub, date);
        return successResponse(summary, "Log added", 201);

    } catch (error) {
        console.error("Create diet log error:", error);
        return errorResponse("Failed to create log", 500);
    }
}
