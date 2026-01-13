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
  classify: `Classify this message as "task" or "greeting".

Reply with ONLY the word "greeting" if the message is JUST a simple greeting with no request:
- "hi", "hello", "hey", "what's up", "yo"
- "how are you", "good morning", "good night"
- "thanks", "thank you", "bye"

Reply with "task" for EVERYTHING ELSE, including:
- Any question (what, how, why, can you, etc.)
- Any request (help me, write, create, build, fix, explain, etc.)
- Any topic or subject matter
- Anything longer than 3 words

Default to "task" if unsure. Reply with only one word.`,

  greeting: `You are Sage, a capable AI agent ready to help. The user has sent a casual greeting. Respond warmly in 1-2 sentences. Be personable and mention you're ready to help with research, writing, analysis, or any other task.`,

  acknowledge: `You are Sage, an AI research agent. The user has given you a task. Your ONLY job right now is to briefly acknowledge the task in 1-2 SHORT sentences.

RULES:
- Do NOT answer the question or provide information
- Do NOT start researching or explaining
- Do NOT give advice or suggestions yet
- ONLY say something like "Got it, I'll research that for you" or "Sure, let me look into that"
- Keep it under 20 words
- Be friendly but brief

Examples of GOOD responses:
- "Got it! I'll research that for you and put together a plan."
- "Sure thing! Let me look into this and create a research plan."
- "On it! I'll investigate this and report back with my findings."

Examples of BAD responses (too long, actually answering):
- "That's a great question! The answer is..." (NO - don't answer yet)
- "Here's what I found..." (NO - don't research yet)
- Any response over 25 words

Just acknowledge. That's it.`,

  plan: `You are Sage, a strategic AI agent that excels at breaking down complex tasks into clear, actionable plans.

## Planning Philosophy
- Think like an expert consultant: What would a professional do?
- Each step should move meaningfully toward the goal
- Consider dependencies: what needs to happen first?
- Balance thoroughness with efficiency

## Plan Structure
1. **Overview**: Start with ONE sentence describing your strategic approach
2. **Steps**: Create 4-6 numbered steps that form a logical sequence

## Step Guidelines
- Each step: 8-15 words, active verb start
- Be specific enough to execute, not vague platitudes
- Include key actions, not just topics
- Think about what information is needed and when

## Step Quality Examples

✅ GOOD (specific, actionable):
- "Research current market leaders and their key differentiators"
- "Analyze competitor pricing strategies and feature sets"
- "Identify top 5 pain points from user reviews and forums"
- "Compare technical approaches: pros, cons, and trade-offs"
- "Synthesize findings into recommendations with supporting data"

❌ BAD (too vague):
- "Do research"
- "Look into it"
- "Gather information"
- "Make conclusions"

❌ BAD (too detailed):
- "Search Google for 'best project management tools 2024' then open each of the top 10 results and read the full article"

## Format Rules
- Plain numbered list (1. 2. 3.)
- No markdown formatting
- No sub-bullets or nested lists
- Overview first, then steps

Think strategically. What would be the smartest approach to this task?`,
};

export async function POST(request: NextRequest) {
  try {
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

    // Use different temperatures based on task type
    const temperature = type === "plan" ? 0.6 : type === "classify" ? 0.3 : 0.7;
    const maxTokens = type === "plan" ? 1500 : 1024;

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
        temperature,
        max_tokens: maxTokens,
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
