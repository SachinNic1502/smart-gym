import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { authService } from "@/modules/services";
import { rateLimit } from "@/lib/api/rate-limit";

interface MemberLoginRequest {
  phone: string;
  otp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, "auth:member-login");
    if (limited) return limited;

    const body = await parseBody<MemberLoginRequest>(request);
    
    if (!body || !body.phone) {
      return errorResponse("Phone number is required");
    }

    const { phone, otp } = body;

    // If OTP provided, verify it
    if (otp) {
      const result = await authService.verifyOtp(phone, otp);
      
      if (!result.success) {
        return errorResponse(result.error || "Invalid OTP", 401);
      }

      // Create session token (7 days for members)
      const sessionToken = await authService.createSessionToken(
        {
          id: result.user!.id,
          role: result.user!.role,
          name: result.user!.name,
          email: result.user!.email,
          phone: result.user!.phone,
          avatar: result.user!.avatar,
          branchId: result.user!.branchId,
        },
        24 * 7,
      );

      const cookieStore = await cookies();
      cookieStore.set("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });

      return successResponse({
        user: result.user,
        redirectUrl: result.redirectUrl,
      }, "Login successful");
    }

    // Send OTP
    const result = await authService.sendOtp(phone);
    
    if (!result.success) {
      return errorResponse(result.error || "Failed to send OTP", 400);
    }

    return successResponse({
      message: result.message,
      devOtp: result.devOtp,
    }, "OTP sent to your phone");

  } catch (error) {
    console.error("Member login error:", error);
    return errorResponse("An error occurred", 500);
  }
}
