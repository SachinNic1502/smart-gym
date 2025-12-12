import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/modules/database/mongoose";
import { requireSession } from "@/lib/api/require-auth";

export async function GET() {
  try {
    const isProd = process.env.NODE_ENV === "production";
    if (isProd) {
      const auth = await requireSession(["super_admin"]);
      if ("response" in auth) return auth.response;
    }

    const mongoUrl = process.env.MONGODB_URI;

    if (!mongoUrl) {
      return NextResponse.json(
        { status: "error", message: "MONGODB_URI not found in env" },
        { status: 500 }
      );
    }

    // Connect only if not already connected
    if (mongoose.connection.readyState !== 1) {
      await connectToDatabase();
    }

    const dbState =
      mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    const databaseInfo =
      isProd
        ? { status: dbState }
        : {
            status: dbState,
            name: mongoose.connection.name,
            host: mongoose.connection.host,
          };

    return NextResponse.json({
      status: "ok",
      service: "Smart Gym Management System",
      database: databaseInfo,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Health check failed",
        error: String(error),
      },
      { status: 500 }
    );
  }
}
