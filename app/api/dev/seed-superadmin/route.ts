import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/modules/database/mongoose";
import { UserModel } from "@/modules/database/models";
import { hashPassword } from "@/modules/database/password";

// POST /api/dev/seed-superadmin
// Development-only endpoint to ensure the default super admin exists in MongoDB.
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const email = "admin@smartfit.com";

    // Check if super admin already exists
    const existing = await UserModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({
        status: "ok",
        message: "Super admin already exists",
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
      });
    }

    const now = new Date().toISOString();

    let password = "admin123";
    try {
      const body = await request.json();
      if (body && typeof body.password === "string" && body.password.length >= 6) {
        password = body.password;
      }
    } catch {
      // no body or invalid JSON; fall back to default password
    }

    const passwordHash = await hashPassword(password);

    const user = await UserModel.create({
      id: "USR_001",
      name: "Super Admin",
      email,
      role: "super_admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      status: "ok",
      message: "Super admin seeded successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to seed super admin",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
