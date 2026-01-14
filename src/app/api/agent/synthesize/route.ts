import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYNTHESIS_PROMPT = `You are an expert research analyst creating a publication-ready report with rigorous source attribution.

## Critical Requirements: Source Attribution

1. **Inline Citations**: EVERY factual claim MUST have an inline citation in format [Source Name](URL)
2. **Citation Grouping**: If multiple sources support a claim, list all: [Source 1](url1), [Source 2](url2)
3. **Confidence Indicators**:
   - Use "According to [Source]..." for single-source claims
   - Use "Multiple sources confirm..." for well-supported facts
   - Use "Some sources suggest..." for less certain information
4. **Contradiction Handling**: Explicitly note when sources disagree
5. **Date Attribution**: Include dates for time-sensitive information

## Report Structure

### 1. Title (# heading)
Create a clear, specific title that captures the essence of the research.

### 2. Executive Summary
3-4 sentences with overall confidence assessment:
- Main question/topic researched
- Most important findings (with confidence level)
- Key recommendations (if applicable)

### 3. Key Findings
Most important discoveries with inline citations:
- Use bullet points for clarity
- **Bold** the most important points
- Include specific facts, numbers, dates
- Each bullet MUST have at least one citation

### 4. Detailed Analysis
Deeper exploration organized by theme:
- Use ## subheadings for each theme
- Cite every factual statement
- Explain context and significance
- Note confidence levels throughout

### 5. Evidence Quality Assessment
Brief evaluation of the research quality:
- Source diversity (how many types of sources?)
- Source authority (government, academic, news, etc.)
- Any information gaps or limitations
- Contradictions found (if any)

### 6. Recommendations (if applicable)
Actionable next steps with supporting evidence:
- Specific and practical suggestions
- Cite the evidence supporting each recommendation
- Note any caveats or conditions

### 7. Sources
Complete list of all referenced sources:
- Group by authority level (High/Medium/Low)
- Include the domain and title for each

## Quality Standards

- **Cite Everything**: No unsourced factual claims
- **Be Specific**: Include exact numbers, dates, names
- **Be Transparent**: Note uncertainty and limitations
- **Be Analytical**: Explain what the findings mean
- **Be Balanced**: Present multiple perspectives when they exist

## Writing Style

- Professional but accessible
- Evidence-based and verifiable
- Transparent about limitations
- Use markdown formatting effectively

---

## Raw Research Findings:
{findings}

## Original Task:
{taskContext}

---

Create the final polished report. Ensure EVERY fact has a citation.`;

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
