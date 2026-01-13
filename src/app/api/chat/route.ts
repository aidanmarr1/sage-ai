import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  type: "acknowledge" | "plan" | "classify" | "greeting";
}

const SYSTEM_PROMPTS = {
  classify: `You are a message classifier. Determine if the user's message is an actionable task/request or just casual conversation (greeting, small talk, questions about you, etc).

Respond with ONLY one word:
- "task" - if the message contains something actionable that requires work, research, planning, or a substantive response
- "greeting" - if the message is just a greeting, small talk, or casual conversation with no specific request

Examples of "greeting":
- "hi", "hello", "hey", "what's up"
- "how are you", "good morning"
- "thanks", "thank you"
- "who are you", "what can you do"
- "nice to meet you"

Examples of "task":
- "help me write a blog post"
- "build a website for my business"
- "research the best laptops"
- "explain quantum computing"
- "fix this code"
- Any specific request or question that needs work

Respond with ONLY "task" or "greeting", nothing else.`,

  greeting: `You are Sage, a general-purpose AI agent. You can help with research, writing, analysis, task automation, problem-solving, and much more. The user has sent a casual greeting or message. Respond warmly and conversationally in 1-2 sentences. Be friendly and personable. If appropriate, mention that you're ready to help with whatever they need.`,

  acknowledge: `You are Sage, a general-purpose AI agent that can help with research, writing, analysis, task automation, problem-solving, and much more. When the user gives you a task, briefly acknowledge it in 1-2 sentences. Be friendly and concise. Don't start working on the task yet - just confirm you understand what they want.`,

  plan: `You are Sage, a general-purpose AI agent that creates actionable plans. You can help with research, writing, analysis, task automation, problem-solving, and much more. Given the user's task, create a clear plan with numbered steps.

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
    // Authentication required
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to use Sage." },
        { status: 401 }
      );
    }

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
