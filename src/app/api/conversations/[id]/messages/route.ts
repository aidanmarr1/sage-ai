import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { nanoid } from "nanoid";

// GET - Fetch messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify conversation ownership
    const checkResult = await db.execute({
      sql: "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
      args: [conversationId, user.id],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Fetch messages
    const result = await db.execute({
      sql: `SELECT id, role, content, created_at as createdAt
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC`,
      args: [conversationId],
    });

    return NextResponse.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Fetch messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Add a message to conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { role, content } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    // Verify conversation ownership
    const checkResult = await db.execute({
      sql: "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
      args: [conversationId, user.id],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const id = nanoid();
    const now = new Date().toISOString();

    await db.execute({
      sql: `INSERT INTO messages (id, conversation_id, role, content, created_at)
            VALUES (?, ?, ?, ?, ?)`,
      args: [id, conversationId, role, content, now],
    });

    // Update conversation's updated_at
    await db.execute({
      sql: "UPDATE conversations SET updated_at = ? WHERE id = ?",
      args: [now, conversationId],
    });

    return NextResponse.json({
      message: { id, role, content, timestamp: now },
    });
  } catch (error) {
    console.error("Add message error:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}
