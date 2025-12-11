import { NextRequest } from "next/server";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { leadService } from "@/modules/services";
import type { Lead } from "@/lib/types";

interface RouteParams {
  params: Promise<{ leadId: string }>;
}

// GET /api/leads/[leadId] - Get a single lead
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const result = leadService.getLead(leadId);
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    return successResponse(result.data);

  } catch (error) {
    console.error("Get lead error:", error);
    return errorResponse("Failed to fetch lead", 500);
  }
}

// PUT /api/leads/[leadId] - Update a lead
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const body = await parseBody<Partial<Lead>>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    const result = leadService.updateLead(leadId, body);
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    return successResponse(result.data, "Lead updated successfully");

  } catch (error) {
    console.error("Update lead error:", error);
    return errorResponse("Failed to update lead", 500);
  }
}

// DELETE /api/leads/[leadId] - Delete a lead
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const result = leadService.deleteLead(leadId);
    
    if (!result.success) {
      return errorResponse(result.error || "Lead not found", 404);
    }

    return successResponse(result.data, "Lead deleted successfully");

  } catch (error) {
    console.error("Delete lead error:", error);
    return errorResponse("Failed to delete lead", 500);
  }
}
