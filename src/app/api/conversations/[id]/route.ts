import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

// GET - Get a single conversation with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get conversation
    const convResult = await db.execute({
      sql: `SELECT id, title, starred, created_at as createdAt, updated_at as updatedAt
            FROM conversations
            WHERE id = ? AND user_id = ?`,
      args: [id, user.id],
    });

    if (convResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const conv = convResult.rows[0];

    // Get messages
    const msgResult = await db.execute({
      sql: `SELECT id, role, content, created_at as createdAt
            FROM messages
            WHERE conversation_id = ?
            ORDER BY created_at ASC`,
      args: [id],
    });

    const messages = msgResult.rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      timestamp: row.createdAt,
    }));

    return NextResponse.json({
      conversation: {
        id: conv.id,
        title: conv.title,
        starred: conv.starred === 1,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        messages,
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}

// PATCH - Update conversation (star/unstar, rename)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, starred } = body;

    // Verify ownership
    const checkResult = await db.execute({
      sql: "SELECT id FROM conversations WHERE id = ? AND user_id = ?",
      args: [id, user.id],
    });

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const args: (string | number)[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      args.push(title);
    }
    if (starred !== undefined) {
      updates.push("starred = ?");
      args.push(starred ? 1 : 0);
    }

    if (updates.length > 0) {
      updates.push("updated_at = ?");
      args.push(new Date().toISOString());
      args.push(id);

      await db.execute({
        sql: `UPDATE conversations SET ${updates.join(", ")} WHERE id = ?`,
        args,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    );
  }
}

// DELETE - Delete conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Delete messages first (cascade should handle this, but being explicit)
    await db.execute({
      sql: "DELETE FROM messages WHERE conversation_id = ?",
      args: [id],
    });

    // Delete conversation
    await db.execute({
      sql: "DELETE FROM conversations WHERE id = ? AND user_id = ?",
      args: [id, user.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete conversation error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}
