import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  type: "acknowledge" | "plan";
}

const SYSTEM_PROMPTS = {
  acknowledge: `You are Sage, a helpful AI assistant. When the user gives you a task, briefly acknowledge it in 1-2 sentences. Be friendly and concise. Don't start working on the task yet - just confirm you understand what they want.`,

  plan: `You are Sage, a helpful AI assistant that creates actionable plans. Given the user's task, create a clear plan with numbered steps.

Rules:
- Start with a 1-sentence overview of the approach
- List 4-6 steps (no more, no less)
- Each step should be 8-15 words maximum
- Be specific enough to be useful, but not overly detailed
- Focus on key milestones, not micro-tasks
- Use active verbs (Build, Create, Set up, Configure, Test, etc.)

Example good steps:
- "Set up the project structure and install dependencies"
- "Create the main database schema with user tables"
- "Build the authentication flow with login and signup"

Example bad steps (too long):
- "Set up the project by running npm init, then install React, React DOM, and configure webpack with babel loader for JSX transformation"

Example bad steps (too generic):
- "Start the project"
- "Add features"

Do not use markdown. Use plain numbered lists (1. 2. 3. etc).`,
};

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.error("DEEPSEEK_API_KEY is not configured");
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { messages, type } = body;

    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.acknowledge;

    const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("DeepSeek API error:", error);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response.";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
