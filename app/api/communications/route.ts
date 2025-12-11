import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody, getPaginationParams } from "@/lib/api/utils";
import { communicationRepository } from "@/modules/database";
import type { BroadcastMessage, MessageChannel } from "@/lib/types";

// GET /api/communications - List communications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = getPaginationParams(searchParams);
    
    const filters = {
      channel: (searchParams.get("channel") as MessageChannel) || undefined,
      status: (searchParams.get("status") as "sent" | "scheduled" | "draft") || undefined,
    };

    const result = communicationRepository.findAll(filters, pagination);
    return successResponse(result);

  } catch (error) {
    console.error("Get communications error:", error);
    return errorResponse("Failed to fetch communications", 500);
  }
}

// POST /api/communications - Create broadcast message
export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<Partial<BroadcastMessage>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    if (!body.title || !body.content || !body.channel) {
      return errorResponse("title, content, and channel are required");
    }

    const message = communicationRepository.create({
      title: body.title,
      content: body.content,
      channel: body.channel,
      recipientCount: body.recipientCount || 0,
      sentAt: body.status === "sent" ? new Date().toISOString() : "",
      status: body.status || "draft",
    });

    return successResponse(message, "Message created successfully", 201);

  } catch (error) {
    console.error("Create communication error:", error);
    return errorResponse("Failed to create message", 500);
  }
}
