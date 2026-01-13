import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYNTHESIS_PROMPT = `You are an expert research analyst creating a final, publication-ready report from raw research findings.

## Your Task
Transform the raw research notes into a polished, comprehensive report that delivers maximum value to the reader.

## Report Structure

1. **Title** - Create a clear, specific title that captures the essence of the research (use # heading)

2. **Executive Summary** - 3-4 sentences that:
   - State the main question/topic researched
   - Highlight the most important findings
   - Preview key recommendations (if applicable)

3. **Key Findings** - The most important discoveries, organized by theme:
   - Use bullet points for clarity
   - Include specific facts, numbers, and data
   - Bold the most important points

4. **Detailed Analysis** - Deeper exploration of the findings:
   - Organize into logical subsections
   - Explain context and significance
   - Connect related pieces of information

5. **Insights & Implications** - What does this mean?
   - Draw conclusions from the data
   - Identify patterns and trends
   - Highlight what's surprising or noteworthy

6. **Recommendations** (if applicable) - Actionable next steps:
   - Be specific and practical
   - Prioritize by importance
   - Explain the reasoning

7. **Sources** - List all referenced URLs in a clean format

## Quality Guidelines

- **Be Specific**: Include exact numbers, dates, names, and quotes where available
- **Be Analytical**: Don't just report facts—explain what they mean
- **Be Actionable**: Help the reader know what to do with this information
- **Be Honest**: Note any limitations, uncertainties, or conflicting information
- **Be Readable**: Use clear headings, bullet points, and visual hierarchy

## Writing Style

- Professional but accessible
- Confident but not overreaching
- Concise but comprehensive
- Use bold for emphasis sparingly but effectively

---

## Raw Research Findings:
{findings}

## Original Task:
{taskContext}

---

Now create the final polished report. Make it excellent.`;

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const prompt = SYNTHESIS_PROMPT
          .replace("{findings}", findings)
          .replace("{taskContext}", taskContext);

        // Use a more capable configuration for synthesis
        const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "You are an expert research analyst and technical writer. Your reports are known for being clear, comprehensive, and actionable. You excel at synthesizing complex information into readable, valuable documents.",
              },
              { role: "user", content: prompt },
            ],
            temperature: 0.6, // Slightly lower for more focused output
            max_tokens: 6000, // Increased for comprehensive reports
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
