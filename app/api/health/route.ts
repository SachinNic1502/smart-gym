import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/modules/database/mongoose";

export async function GET() {
  try {
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

    return NextResponse.json({
      status: "ok",
      service: "Smart Gym Management System",
      database: {
        status: dbState,
        name: mongoose.connection.name,
        host: mongoose.connection.host,
      },
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
