import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const STEEL_API_KEY = process.env.STEEL_API_KEY;

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
      name: "browse_website",
      description: "Browse a website to extract detailed content. Use this when a search result looks particularly promising and you need more detailed information than the snippet provides. Don't browse every result - only the most relevant 1-2 per step.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to browse and extract content from",
          },
        },
        required: ["url"],
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
3. Use browse_website when a search result needs deeper investigation
4. Use write_findings to document the key insights you discover
5. Be thorough but concise in your findings

Guidelines:
- Always search for real, current information before writing findings
- Use browse_website when you find a promising search result that needs deeper exploration
  - Only browse 1-2 of the most relevant URLs per step (not every result)
  - Browse when snippets aren't enough and you need full article content
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

interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
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

async function executeSearch(query: string): Promise<{ results: SearchResult[] }> {
  // Serper.dev - Real Google search results
  if (!SERPER_API_KEY) {
    console.error("SERPER_API_KEY not configured");
    return { results: [] };
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });

    if (!response.ok) {
      console.error("Serper API error:", response.status);
      return { results: [] };
    }

    const data = await response.json();
    const organic = data.organic || [];

    const results = organic.map((r: { title: string; link: string; snippet: string }) => {
      let favicon: string | undefined;
      try {
        const hostname = new URL(r.link).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      } catch {
        favicon = undefined;
      }

      return {
        title: r.title,
        url: r.link,
        content: r.snippet || "",
        favicon,
      };
    });

    return { results };
  } catch (error) {
    console.error("Search error:", error);
    return { results: [] };
  }
}

// Steel API - Browser session management
interface SteelSession {
  id: string;
  sessionViewerUrl: string;
}

interface SteelScrapeResult {
  content: string;
  title?: string;
  screenshot?: string;
}

async function createSteelSession(): Promise<SteelSession | null> {
  if (!STEEL_API_KEY) {
    console.error("STEEL_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch("https://api.steel.dev/v1/sessions", {
      method: "POST",
      headers: {
        "Steel-Api-Key": STEEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeout: 300000, // 5 minute session
      }),
    });

    if (!response.ok) {
      console.error("Steel session creation failed:", response.status);
      return null;
    }

    const data = await response.json();
    return {
      id: data.id,
      sessionViewerUrl: data.sessionViewerUrl,
    };
  } catch (error) {
    console.error("Steel session error:", error);
    return null;
  }
}

// Take a screenshot using Steel's scrape endpoint with screenshot option
async function takeScreenshotViaScrape(url: string): Promise<string | null> {
  if (!STEEL_API_KEY) return null;

  try {
    const response = await fetch("https://api.steel.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Steel-Api-Key": STEEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        format: ["html"],
        screenshot: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Steel scrape/screenshot failed:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log("Steel scrape response - all keys:", JSON.stringify(Object.keys(data)));
    console.log("Steel scrape response - full data preview:", JSON.stringify(data).substring(0, 500));

    // Check various possible screenshot field names
    const screenshot = data.screenshot || data.screenshotUrl || data.screenshot_url || data.image || data.imageUrl;

    if (screenshot) {
      console.log("Found screenshot field, type:", typeof screenshot, "length:", screenshot.length, "starts with:", screenshot.substring(0, 50));

      // If it's a URL, fetch and convert to base64
      if (screenshot.startsWith("http")) {
        console.log("Screenshot is a URL, fetching...");
        const imgResponse = await fetch(screenshot);
        const arrayBuffer = await imgResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        console.log("Converted URL to base64, length:", base64.length);
        return base64;
      }

      // If it already looks like base64
      return screenshot;
    }

    console.log("No screenshot field found in response");
    return null;
  } catch (error) {
    console.error("Screenshot error:", error);
    return null;
  }
}

async function browsePage(
  url: string,
  sessionId: string | undefined,
  onScreenshot: (screenshot: string) => void
): Promise<SteelScrapeResult | null> {
  if (!STEEL_API_KEY) {
    console.error("STEEL_API_KEY not configured");
    return null;
  }

  try {
    // Take screenshot first (this also navigates to the page)
    const screenshot = await takeScreenshotViaScrape(url);
    if (screenshot) {
      onScreenshot(screenshot);
    }

    // Now scrape the page for content
    const response = await fetch("https://api.steel.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Steel-Api-Key": STEEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        sessionId,
        format: "markdown",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Steel scrape failed:", response.status, errorText);
      // Still return with screenshot if we have it
      return screenshot ? { content: "", screenshot: screenshot || undefined } : null;
    }

    const data = await response.json();
    console.log("Steel scrape response keys:", Object.keys(data));

    return {
      content: data.content || data.markdown || "",
      title: data.title || data.metadata?.title,
      screenshot: screenshot || undefined,
    };
  } catch (error) {
    console.error("Steel browse error:", error);
    return null;
  }
}

async function releaseSteelSession(sessionId: string): Promise<void> {
  if (!STEEL_API_KEY) return;

  try {
    await fetch(`https://api.steel.dev/v1/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "Steel-Api-Key": STEEL_API_KEY,
      },
    });
  } catch (error) {
    console.error("Steel session release error:", error);
  }
}

export async function POST(request: NextRequest) {
  // Authentication required
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

  const body: ExecuteRequest = await request.json();
  const { step, stepIndex, taskContext, currentFindings } = body;

  // Create a streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send an event
      const sendEvent = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      let newFindingsContent = "";
      let latestSearchResults: SearchResult[] = [];
      let steelSession: SteelSession | null = null;

      try {
        // Send thinking action immediately
        sendEvent("action", {
          type: "thinking",
          label: `Analyzing step ${stepIndex + 1}...`,
          status: "running",
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
        const maxIterations = 5;

        // Complete thinking action
        sendEvent("action", {
          type: "thinking",
          label: `Analyzing step ${stepIndex + 1}...`,
          status: "completed",
        });

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
              tool_choice: iterations === 1 ? "required" : "auto",
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });

          if (!response.ok) {
            sendEvent("action", {
              type: "error",
              label: "Failed to process step",
              status: "error",
            });
            break;
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

                // Send searching action (running)
                sendEvent("action", {
                  type: "searching",
                  label: `Searching "${query.substring(0, 40)}${query.length > 40 ? "..." : ""}"`,
                  status: "running",
                });

                try {
                  const searchResults = await executeSearch(query);
                  const resultCount = searchResults.results.length;
                  latestSearchResults = searchResults.results;

                  // Send search complete action
                  sendEvent("action", {
                    type: "search_complete",
                    label: `Found ${resultCount} result${resultCount !== 1 ? "s" : ""}`,
                    status: "completed",
                  });

                  // Send search results for ComputerPanel
                  sendEvent("searchResults", latestSearchResults);

                  // Format search results for the LLM
                  const formattedResults = searchResults.results
                    .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
                    .join("\n\n");

                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: formattedResults || "No results found.",
                  });
                } catch (error) {
                  sendEvent("action", {
                    type: "error",
                    label: "Search failed",
                    status: "error",
                  });

                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: "Search failed. Please try a different query.",
                  });
                }
              } else if (functionName === "browse_website") {
                const url = args.url || "";

                // Get display URL (truncated)
                let displayUrl = url;
                try {
                  const urlObj = new URL(url);
                  displayUrl = urlObj.hostname + urlObj.pathname.substring(0, 30);
                  if (urlObj.pathname.length > 30) displayUrl += "...";
                } catch {
                  displayUrl = url.substring(0, 40) + (url.length > 40 ? "..." : "");
                }

                // Send browsing action (running)
                sendEvent("action", {
                  type: "browsing",
                  label: `Browsing ${displayUrl}`,
                  status: "running",
                });

                try {
                  // Create session if we don't have one
                  if (!steelSession) {
                    steelSession = await createSteelSession();
                    if (steelSession) {
                      // Send browser session info
                      sendEvent("browserState", {
                        sessionId: steelSession.id,
                        liveViewUrl: steelSession.sessionViewerUrl,
                        currentUrl: url,
                        isActive: true,
                      });
                    }
                  } else {
                    // Update current URL
                    sendEvent("browserState", {
                      currentUrl: url,
                      isActive: true,
                    });
                  }

                  // Browse page with live screenshot streaming
                  const browseResult = await browsePage(
                    url,
                    steelSession?.id,
                    (screenshot) => {
                      // Stream each screenshot to the frontend
                      sendEvent("browserState", {
                        screenshot,
                        currentUrl: url,
                        isActive: true,
                      });
                    }
                  );

                  if (browseResult) {
                    // Send browsing complete
                    sendEvent("action", {
                      type: "browsing",
                      label: `Browsing ${displayUrl}`,
                      status: "completed",
                    });

                    // Truncate content for LLM if too long
                    let pageContent = browseResult.content;
                    if (pageContent.length > 8000) {
                      pageContent = pageContent.substring(0, 8000) + "\n\n[Content truncated...]";
                    }

                    messages.push({
                      role: "tool",
                      tool_call_id: toolCall.id,
                      content: `# ${browseResult.title || "Page Content"}\nURL: ${url}\n\n${pageContent}`,
                    });
                  } else {
                    sendEvent("action", {
                      type: "error",
                      label: "Failed to browse page",
                      status: "error",
                    });

                    messages.push({
                      role: "tool",
                      tool_call_id: toolCall.id,
                      content: "Failed to browse this page. Try a different URL or use search results instead.",
                    });
                  }
                } catch (error) {
                  sendEvent("action", {
                    type: "error",
                    label: "Browse failed",
                    status: "error",
                  });

                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: "Failed to browse page. Please try a different URL.",
                  });
                }
              } else if (functionName === "write_findings") {
                const heading = args.heading || "Findings";
                const content = args.content || "";

                // Send writing action (running)
                sendEvent("action", {
                  type: "writing",
                  label: `Writing "${heading}"`,
                  status: "running",
                });

                // Append to findings
                const newSection = `\n## ${heading}\n\n${content}\n`;
                newFindingsContent += newSection;

                // Send findings update
                sendEvent("findings", newSection);

                // Send writing complete
                sendEvent("action", {
                  type: "writing",
                  label: `Writing "${heading}"`,
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Successfully added section "${heading}" to findings.`,
                });
              }
            }
          } else {
            continueLoop = false;
          }

          if (choice.finish_reason === "stop") {
            continueLoop = false;
          }
        }

        // Release Steel session if we created one
        if (steelSession) {
          await releaseSteelSession(steelSession.id);
          sendEvent("browserState", {
            isActive: false,
          });
          steelSession = null;
        }

        // Send step complete action
        sendEvent("action", {
          type: "complete",
          label: `Step ${stepIndex + 1} complete`,
          status: "completed",
        });

        // Send final summary
        sendEvent("done", {
          newFindings: newFindingsContent,
          searchResults: latestSearchResults,
        });

      } catch (error) {
        console.error("Agent execute error:", error);

        // Clean up Steel session on error
        if (steelSession) {
          await releaseSteelSession(steelSession.id);
          steelSession = null;
        }

        sendEvent("action", {
          type: "error",
          label: "Execution failed",
          status: "error",
        });
        sendEvent("done", { error: "Internal server error" });
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
