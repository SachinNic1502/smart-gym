import { cookies } from "next/headers";
import { successResponse, unauthorizedResponse } from "@/lib/api/utils";
import { authService } from "@/modules/services";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return unauthorizedResponse("No session found");
    }

    // Validate session token
    const session = authService.validateSession(sessionCookie.value);
    if (!session) {
      cookieStore.delete("session");
      return unauthorizedResponse("Session expired or invalid");
    }

    // Find user
    const user = authService.getUserById(session.userId);
    if (!user) {
      return unauthorizedResponse("User not found");
    }

    return successResponse({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        branchId: user.branchId,
      },
    });

  } catch (error) {
    console.error("Session error:", error);
    return unauthorizedResponse("Invalid session");
  }
}
