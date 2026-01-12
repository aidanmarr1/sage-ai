import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, initializeDatabase } from "@/lib/db";
import { nanoid } from "nanoid";

// GET - List all conversations for the user
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await db.execute({
      sql: `SELECT id, title, starred, created_at as createdAt, updated_at as updatedAt
            FROM conversations
            WHERE user_id = ?
            ORDER BY updated_at DESC`,
      args: [user.id],
    });

    const conversations = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      starred: row.starred === 1,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Failed to get conversations" },
      { status: 500 }
    );
  }
}

// POST - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    await initializeDatabase();

    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO conversations (id, user_id, title, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, user.id, title, now, now],
    });

    return NextResponse.json({
      conversation: { id, title, starred: false, createdAt: now, updatedAt: now },
    });
  } catch (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
