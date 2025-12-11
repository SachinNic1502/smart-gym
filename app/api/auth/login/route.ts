import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { successResponse, errorResponse, parseBody } from "@/lib/api/utils";
import { loginSchema } from "@/lib/validations/auth";
import { authService } from "@/modules/services";

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseBody<LoginRequest>(request);
    
    if (!body) {
      return errorResponse("Invalid request body");
    }

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      const issues = validation.error.issues;
      return errorResponse(issues[0]?.message || "Validation failed", 422);
    }

    const { email, password } = validation.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Authenticate user
    const result = await authService.login(normalizedEmail, password);
    
    if (!result.success) {
      return errorResponse(result.error || "Login failed", 401);
    }

    // Create session token
    const sessionToken = authService.createSessionToken(
      result.user!.id,
      result.user!.role,
      24
    );

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return successResponse({
      user: result.user,
      redirectUrl: result.redirectUrl,
    }, "Login successful");

  } catch (error) {
    console.error("Login error:", error);
    return errorResponse("An error occurred during login", 500);
  }
}
