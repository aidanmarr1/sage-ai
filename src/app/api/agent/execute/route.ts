import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

// Tool definitions for the agent
const TOOLS = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information on a topic. Use this to find relevant data, facts, and sources.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query to find information about",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_findings",
      description: "Add a section to the findings document with your research results. Use markdown formatting.",
      parameters: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description: "The section heading (e.g., 'Key Features', 'Comparison')",
          },
          content: {
            type: "string",
            description: "The markdown content to add under this heading",
          },
        },
        required: ["heading", "content"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Sage, an AI agent executing a research task step by step.

For each step you receive, you should:
1. Analyze what information is needed to complete this step
2. Use web_search to find relevant, current information
3. Use write_findings to document the key insights you discover
4. Be thorough but concise in your findings

Guidelines:
- Always search for real, current information before writing findings
- Write findings in clear, organized markdown format
- Include specific facts, numbers, and sources when available
- Focus on actionable, useful information
- If a search doesn't return useful results, try a different query

You must call at least one tool to complete each step.`;

interface ExecuteRequest {
  step: string;
  stepIndex: number;
  taskContext: string;
  currentFindings: string;
}

interface ActionEvent {
  type: "thinking" | "searching" | "search_complete" | "writing" | "complete" | "error";
  label: string;
  detail?: string;
}

interface ExecuteResponse {
  actions: ActionEvent[];
  newFindings: string;
  summary: string;
  error?: string;
}

// Type for chat messages including tool calls and tool responses
interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string;
  tool_calls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

// List of public SearXNG instances (free, no API key needed)
const SEARXNG_INSTANCES = [
  "https://search.sapti.me",
  "https://searx.be",
  "https://search.bus-hit.me",
  "https://searx.tiekoetter.com",
  "https://search.ononoki.org",
];

async function executeSearch(query: string): Promise<{ results: Array<{ title: string; url: string; content: string }> }> {
  // Try each SearXNG instance until one works
  for (const instance of SEARXNG_INSTANCES) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; SageAI/1.0)",
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const results = (data.results || []).slice(0, 5).map((r: { title?: string; url?: string; content?: string }) => ({
        title: r.title || "",
        url: r.url || "",
        content: r.content || "",
      }));

      if (results.length > 0) {
        return { results };
      }
    } catch (error) {
      console.log(`SearXNG instance ${instance} failed, trying next...`);
      continue;
    }
  }

  // All instances failed
  return { results: [] };
}

export async function POST(request: NextRequest) {
  try {
    // Authentication required
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 }
      );
    }

    const body: ExecuteRequest = await request.json();
    const { step, stepIndex, taskContext, currentFindings } = body;

    const actions: ActionEvent[] = [];
    let newFindingsContent = "";

    // Add thinking action
    actions.push({
      type: "thinking",
      label: `Analyzing step ${stepIndex + 1}...`,
    });

    // Build the user message
    const userMessage = `Task: ${taskContext}

Current step to execute (Step ${stepIndex + 1}): ${step}

${currentFindings ? `Previous findings so far:\n${currentFindings}` : "No findings yet - this is the first step."}

Execute this step by searching for relevant information and documenting your findings.`;

    // Call LLM with tools
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ];

    let continueLoop = true;
    let iterations = 0;
    const maxIterations = 5; // Prevent infinite loops

    while (continueLoop && iterations < maxIterations) {
      iterations++;

      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          tools: TOOLS,
          tool_choice: iterations === 1 ? "required" : "auto", // Force tool use on first iteration
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("DeepSeek API error:", error);
        actions.push({
          type: "error",
          label: "Failed to process step",
          detail: "AI service error",
        });
        return NextResponse.json({
          actions,
          newFindings: newFindingsContent,
          summary: "Error executing step",
          error: "AI service error",
        } as ExecuteResponse);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const message = choice?.message;

      if (!message) {
        continueLoop = false;
        break;
      }

      // Check if there are tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        // Add assistant message with tool calls to conversation
        messages.push(message);

        // Process each tool call
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          let args;

          try {
            args = JSON.parse(toolCall.function.arguments);
          } catch {
            args = {};
          }

          if (functionName === "web_search") {
            const query = args.query || "";
            actions.push({
              type: "searching",
              label: `Searching "${query.substring(0, 40)}${query.length > 40 ? "..." : ""}"`,
            });

            try {
              const searchResults = await executeSearch(query);
              const resultCount = searchResults.results.length;

              actions.push({
                type: "search_complete",
                label: `Found ${resultCount} result${resultCount !== 1 ? "s" : ""}`,
              });

              // Format search results for the LLM
              const formattedResults = searchResults.results
                .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
                .join("\n\n");

              // Add tool result to messages
              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: formattedResults || "No results found.",
              });
            } catch (error) {
              actions.push({
                type: "error",
                label: "Search failed",
                detail: error instanceof Error ? error.message : "Unknown error",
              });

              messages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: "Search failed. Please try a different query or proceed with available information.",
              });
            }
          } else if (functionName === "write_findings") {
            const heading = args.heading || "Findings";
            const content = args.content || "";

            actions.push({
              type: "writing",
              label: `Writing "${heading}"`,
            });

            // Append to findings
            const newSection = `\n## ${heading}\n\n${content}\n`;
            newFindingsContent += newSection;

            // Add tool result to messages
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: `Successfully added section "${heading}" to findings.`,
            });
          }
        }
      } else {
        // No more tool calls, we're done
        continueLoop = false;
      }

      // Check finish reason
      if (choice.finish_reason === "stop") {
        continueLoop = false;
      }
    }

    // Add completion action
    actions.push({
      type: "complete",
      label: `Step ${stepIndex + 1} complete`,
    });

    // Generate summary from the final message or a default
    const summary = newFindingsContent
      ? `Completed research and added findings.`
      : `Analyzed step ${stepIndex + 1}.`;

    return NextResponse.json({
      actions,
      newFindings: newFindingsContent,
      summary,
    } as ExecuteResponse);
  } catch (error) {
    console.error("Agent execute error:", error);
    return NextResponse.json(
      {
        actions: [{ type: "error", label: "Execution failed" }],
        newFindings: "",
        summary: "Error",
        error: "Internal server error",
      } as ExecuteResponse,
      { status: 500 }
    );
  }
}
