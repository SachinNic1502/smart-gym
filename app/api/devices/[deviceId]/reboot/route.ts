import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api/utils";
import { deviceService } from "@/modules/services";

export async function POST(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
    try {
        const { deviceId } = await params;
        const result = await deviceService.getDevice(deviceId); // Verify existence
        if (!result.data) {
            return errorResponse("Device not found", 404);
        }
        // Mock reboot
        return successResponse({ success: true, message: "Reboot initiated" });
    } catch (error) {
        return errorResponse("Failed to reboot device", 500);
    }
}
