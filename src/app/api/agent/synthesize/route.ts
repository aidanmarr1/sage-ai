import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYNTHESIS_PROMPT = `You are creating a final research report from raw findings.

Your task is to take the raw research notes below and transform them into a polished, professional report that:

1. Starts with a clear, descriptive title (# Title)
2. Includes an Executive Summary section (2-3 sentences)
3. Organizes information into logical sections
4. Highlights key insights and actionable recommendations
5. Includes source URLs where available
6. Uses clear, professional language
7. Is well-formatted with proper markdown (headings, bullet points, bold for emphasis)

Keep it concise but comprehensive. Focus on delivering value to the reader.

Raw Research Findings:
{findings}

Original Task: {taskContext}

Create the final polished report:`;

interface SynthesizeRequest {
  findings: string;
  taskContext: string;
}

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "AI service not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body: SynthesizeRequest = await request.json();
  const { findings, taskContext } = body;

  if (!findings) {
    return new Response(JSON.stringify({ error: "No findings to synthesize" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const prompt = SYNTHESIS_PROMPT
          .replace("{findings}", findings)
          .replace("{taskContext}", taskContext);

        const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "user", content: prompt },
            ],
            temperature: 0.7,
            max_tokens: 4096,
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", data: "Failed to generate report" })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content", data: content })}\n\n`));
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
      } catch (error) {
        console.error("Synthesis error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", data: "Synthesis failed" })}\n\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
