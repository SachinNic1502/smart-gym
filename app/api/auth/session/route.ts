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
    const session = await authService.validateSession(sessionCookie.value);
    if (!session) {
      cookieStore.delete("session");
      return unauthorizedResponse("Session expired or invalid");
    }

    return successResponse({
      user: {
        id: session.sub,
        name: session.name ?? "",
        email: session.email ?? "",
        phone: session.phone,
        role: session.role,
        avatar: session.avatar,
        branchId: session.branchId,
      },
    });

  } catch (error) {
    console.error("Session error:", error);
    return unauthorizedResponse("Invalid session");
  }
}
