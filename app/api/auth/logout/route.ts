import { cookies } from "next/headers";
import { successResponse } from "@/lib/api/utils";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("session"); // clear session cookie

  return successResponse({ redirectUrl: "/login" }, "Logged out successfully");
}

export async function GET() {
  return POST();
}