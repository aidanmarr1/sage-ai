import { NextResponse } from "next/server";
import { initializeDatabase } from "@/lib/db";

export async function POST() {
  try {
    // Check if env vars are set
    const hasDbUrl = !!process.env.TURSO_DATABASE_URL;
    const hasDbToken = !!process.env.TURSO_AUTH_TOKEN;

    if (!hasDbUrl || !hasDbToken) {
      return NextResponse.json(
        {
          error: "Missing environment variables",
          hasDbUrl,
          hasDbToken,
        },
        { status: 500 }
      );
    }

    await initializeDatabase();
    return NextResponse.json({ success: true, message: "Database initialized" });
  } catch (error) {
    console.error("Database init error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to initialize database", details: errorMessage },
      { status: 500 }
    );
  }
}
