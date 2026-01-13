import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const STEEL_API_KEY = process.env.STEEL_API_KEY;

// Enhanced tool definitions with more capabilities
const TOOLS = [
  {
    type: "function",
    function: {
      name: "reason",
      description: "Think through the problem step-by-step before taking action. Use this FIRST to plan your approach, analyze what you know, identify gaps, and decide which tools to use. This helps ensure high-quality, thoughtful research.",
      parameters: {
        type: "object",
        properties: {
          thinking: {
            type: "string",
            description: "Your detailed reasoning about: 1) What do I need to find out? 2) What do I already know? 3) What's the best approach? 4) Which tools should I use and why?",
          },
          plan: {
            type: "string",
            description: "A brief 2-3 step plan for completing this research step",
          },
        },
        required: ["thinking", "plan"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information. Returns multiple results with titles, URLs, and snippets. Use specific, targeted queries for best results.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query - be specific and include relevant keywords",
          },
          search_type: {
            type: "string",
            enum: ["general", "news", "academic", "comparison"],
            description: "Type of search: 'general' for broad info, 'news' for recent events, 'academic' for research/studies, 'comparison' for comparing options",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deep_search",
      description: "Perform a more thorough search by running multiple related queries and combining results. Use when you need comprehensive coverage of a topic or when initial search results are insufficient.",
      parameters: {
        type: "object",
        properties: {
          main_topic: {
            type: "string",
            description: "The main topic to research thoroughly",
          },
          aspects: {
            type: "array",
            items: { type: "string" },
            description: "Different aspects or angles to search for (2-4 aspects)",
          },
        },
        required: ["main_topic", "aspects"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "browse_website",
      description: "Extract full content from a webpage. Use when search snippets aren't enough and you need detailed information from a specific source. Only browse the most relevant 1-2 URLs per step.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "The URL to browse",
          },
          focus: {
            type: "string",
            description: "What specific information to look for on this page",
          },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_and_extract",
      description: "Analyze collected information to extract key insights, patterns, and structured data. Use after gathering raw information to make sense of it.",
      parameters: {
        type: "object",
        properties: {
          raw_data: {
            type: "string",
            description: "The raw information to analyze",
          },
          analysis_type: {
            type: "string",
            enum: ["summarize", "compare", "trends", "pros_cons", "key_facts", "recommendations"],
            description: "Type of analysis to perform",
          },
          context: {
            type: "string",
            description: "Context about what the user needs this analysis for",
          },
        },
        required: ["raw_data", "analysis_type"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "validate_information",
      description: "Cross-check and validate information by looking for confirming or contradicting sources. Use for important facts that need verification.",
      parameters: {
        type: "object",
        properties: {
          claim: {
            type: "string",
            description: "The claim or fact to validate",
          },
          source: {
            type: "string",
            description: "Where this claim came from",
          },
        },
        required: ["claim"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_findings",
      description: "Document research findings in the final report. Use markdown formatting. Include sources and be specific with facts and data.",
      parameters: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description: "Section heading",
          },
          content: {
            type: "string",
            description: "Detailed markdown content with facts, insights, and sources",
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "How confident you are in this information based on source quality",
          },
          sources: {
            type: "array",
            items: { type: "string" },
            description: "URLs of sources used for this section",
          },
        },
        required: ["heading", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "self_evaluate",
      description: "Evaluate your progress and decide if more research is needed. Use this before finishing to ensure quality.",
      parameters: {
        type: "object",
        properties: {
          what_i_found: {
            type: "string",
            description: "Summary of what you've discovered",
          },
          quality_assessment: {
            type: "string",
            enum: ["excellent", "good", "needs_more_research", "insufficient"],
            description: "How complete and high-quality is the research so far",
          },
          gaps: {
            type: "string",
            description: "What information is still missing or unclear",
          },
          next_action: {
            type: "string",
            description: "What to do next: 'complete' if done, or describe what additional research is needed",
          },
        },
        required: ["what_i_found", "quality_assessment", "next_action"],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Sage, an elite AI research agent with advanced reasoning capabilities. Your goal is to conduct thorough, accurate, and insightful research.

## Core Principles

1. **Think Before Acting**: Always use the 'reason' tool first to plan your approach. Quality thinking leads to quality results.

2. **Be Thorough But Efficient**: Gather comprehensive information but don't waste time on irrelevant tangents.

3. **Verify Important Facts**: Use 'validate_information' for critical claims. Cross-reference when possible.

4. **Synthesize, Don't Just Collect**: Use 'analyze_and_extract' to turn raw data into insights.

5. **Self-Monitor Quality**: Use 'self_evaluate' to assess your progress and identify gaps.

## Research Workflow

For each step, follow this pattern:
1. **REASON** - Think through what you need to find and plan your approach
2. **SEARCH** - Use web_search or deep_search to gather information
3. **DEEP DIVE** - Browse key sources when snippets aren't enough
4. **ANALYZE** - Extract insights and patterns from raw data
5. **VALIDATE** - Verify important facts when needed
6. **EVALUATE** - Check if you have enough quality information
7. **WRITE** - Document your findings with sources

## Quality Standards

- Include specific facts, numbers, dates, and names when available
- Always cite sources with URLs
- Distinguish between facts and opinions
- Note confidence levels for uncertain information
- Provide actionable insights, not just raw data

## Tool Selection Guide

- **reason**: Start every step with this. Plan before you act.
- **web_search**: For specific queries. Use 'news' type for recent events.
- **deep_search**: When you need comprehensive coverage from multiple angles.
- **browse_website**: Only for the 1-2 most promising sources that need full content.
- **analyze_and_extract**: To synthesize raw information into insights.
- **validate_information**: For important claims that need verification.
- **self_evaluate**: Before finishing, to ensure quality.
- **write_findings**: To document results with sources.

Remember: Quality over quantity. It's better to have well-researched, verified information than lots of unverified claims.`;

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

// Execute a single search query
async function executeSearch(query: string, searchType?: string): Promise<{ results: SearchResult[] }> {
  if (!SERPER_API_KEY) {
    console.error("SERPER_API_KEY not configured");
    return { results: [] };
  }

  try {
    // Adjust query based on search type
    let adjustedQuery = query;
    if (searchType === "news") {
      adjustedQuery = `${query} latest news 2024 2025`;
    } else if (searchType === "academic") {
      adjustedQuery = `${query} research study`;
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: adjustedQuery,
        num: searchType === "news" ? 10 : 8,
      }),
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

// Execute multiple searches for deep research
async function executeDeepSearch(
  mainTopic: string,
  aspects: string[]
): Promise<{ results: SearchResult[]; summary: string }> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Search for each aspect
  for (const aspect of aspects.slice(0, 4)) {
    const query = `${mainTopic} ${aspect}`;
    const searchResults = await executeSearch(query);

    // Deduplicate results
    for (const result of searchResults.results) {
      if (!seenUrls.has(result.url)) {
        seenUrls.add(result.url);
        allResults.push(result);
      }
    }
  }

  // Sort by relevance (results appearing in multiple searches first would be ideal,
  // but for now just return deduplicated results)
  return {
    results: allResults.slice(0, 15),
    summary: `Found ${allResults.length} unique results across ${aspects.length} aspects of "${mainTopic}"`,
  };
}

// Browse and extract page content using Steel
async function browsePage(
  url: string,
  focus?: string,
  onUpdate?: (status: string) => void
): Promise<{ content: string; title?: string } | null> {
  if (!STEEL_API_KEY) {
    console.error("STEEL_API_KEY not configured");
    return null;
  }

  try {
    onUpdate?.("loading");

    const response = await fetch("https://api.steel.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Steel-Api-Key": STEEL_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        format: ["markdown"],
      }),
    });

    if (!response.ok) {
      console.error("Steel scrape failed:", response.status);
      onUpdate?.("error");
      return null;
    }

    const data = await response.json();
    onUpdate?.("complete");

    let content = data.content || data.markdown || data.html || "";

    // Truncate if too long
    if (content.length > 10000) {
      content = content.substring(0, 10000) + "\n\n[Content truncated for length...]";
    }

    return {
      content,
      title: data.title || data.metadata?.title,
    };
  } catch (error) {
    console.error("Steel browse error:", error);
    onUpdate?.("error");
    return null;
  }
}

// Validate information by searching for confirmation
async function validateInformation(
  claim: string,
  originalSource?: string
): Promise<{ isValid: boolean; confidence: string; evidence: string }> {
  // Search for the claim to find corroborating sources
  const searchResults = await executeSearch(`"${claim.substring(0, 50)}" verify fact check`);

  if (searchResults.results.length === 0) {
    return {
      isValid: false,
      confidence: "low",
      evidence: "Could not find corroborating sources",
    };
  }

  // Check if multiple sources confirm the claim
  const confirmingSources = searchResults.results.filter(r =>
    r.content.toLowerCase().includes(claim.toLowerCase().substring(0, 30))
  );

  if (confirmingSources.length >= 2) {
    return {
      isValid: true,
      confidence: "high",
      evidence: `Found ${confirmingSources.length} sources confirming this information: ${confirmingSources.map(s => s.url).join(", ")}`,
    };
  } else if (confirmingSources.length === 1) {
    return {
      isValid: true,
      confidence: "medium",
      evidence: `Found 1 additional source: ${confirmingSources[0].url}`,
    };
  }

  return {
    isValid: false,
    confidence: "low",
    evidence: "Could not confirm with additional sources",
  };
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

  const body: ExecuteRequest = await request.json();
  const { step, stepIndex, taskContext, currentFindings } = body;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      let newFindingsContent = "";
      let latestSearchResults: SearchResult[] = [];
      let reasoningContext = "";

      try {
        sendEvent("action", {
          type: "thinking",
          label: `Analyzing step ${stepIndex + 1}...`,
          status: "running",
        });

        const userMessage = `## Current Task
${taskContext}

## Step to Execute (Step ${stepIndex + 1})
${step}

## Previous Research
${currentFindings ? currentFindings : "No findings yet - this is the first step."}

## Instructions
1. First, use the 'reason' tool to think through your approach
2. Then execute your research plan using the available tools
3. Before finishing, use 'self_evaluate' to check quality
4. Document your findings with 'write_findings'

Execute this step thoroughly and provide high-quality research.`;

        const messages: ChatMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ];

        let continueLoop = true;
        let iterations = 0;
        const maxIterations = 8; // Increased for more thorough research
        let hasWrittenFindings = false;

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
            // Auto-retry on failure
            if (iterations < 3) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
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

          if (message.tool_calls && message.tool_calls.length > 0) {
            messages.push(message);

            for (const toolCall of message.tool_calls) {
              const functionName = toolCall.function.name;
              let args;

              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch {
                args = {};
              }

              // Handle each tool
              if (functionName === "reason") {
                sendEvent("action", {
                  type: "thinking",
                  label: "Planning approach...",
                  status: "running",
                });

                reasoningContext = args.thinking || "";
                const plan = args.plan || "";

                sendEvent("action", {
                  type: "thinking",
                  label: "Planning approach...",
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Reasoning recorded. Your plan: ${plan}\n\nNow execute this plan using the appropriate tools.`,
                });

              } else if (functionName === "web_search") {
                const query = args.query || "";
                const searchType = args.search_type || "general";

                sendEvent("action", {
                  type: "searching",
                  label: `Searching: "${query.substring(0, 35)}${query.length > 35 ? "..." : ""}"`,
                  status: "running",
                });

                const searchResults = await executeSearch(query, searchType);
                latestSearchResults = searchResults.results;

                sendEvent("action", {
                  type: "search_complete",
                  label: `Found ${searchResults.results.length} results`,
                  status: "completed",
                });

                sendEvent("searchResults", latestSearchResults);

                const formattedResults = searchResults.results
                  .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
                  .join("\n\n");

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: formattedResults || "No results found. Try a different query.",
                });

              } else if (functionName === "deep_search") {
                const mainTopic = args.main_topic || "";
                const aspects = args.aspects || [];

                sendEvent("action", {
                  type: "searching",
                  label: `Deep research: "${mainTopic.substring(0, 30)}..."`,
                  status: "running",
                });

                const deepResults = await executeDeepSearch(mainTopic, aspects);
                latestSearchResults = deepResults.results;

                sendEvent("action", {
                  type: "search_complete",
                  label: deepResults.summary,
                  status: "completed",
                });

                sendEvent("searchResults", latestSearchResults);

                const formattedResults = deepResults.results
                  .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.content}`)
                  .join("\n\n");

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `${deepResults.summary}\n\n${formattedResults}`,
                });

              } else if (functionName === "browse_website") {
                const url = args.url || "";
                const focus = args.focus;

                let displayUrl = url;
                try {
                  const urlObj = new URL(url);
                  displayUrl = urlObj.hostname + urlObj.pathname.substring(0, 25);
                } catch {
                  displayUrl = url.substring(0, 35);
                }

                sendEvent("action", {
                  type: "browsing",
                  label: `Reading: ${displayUrl}...`,
                  status: "running",
                });

                sendEvent("browserState", {
                  currentUrl: url,
                  isActive: true,
                });

                const browseResult = await browsePage(url, focus, (status) => {
                  sendEvent("browserState", {
                    currentUrl: url,
                    isActive: status === "loading",
                    status,
                  });
                });

                if (browseResult) {
                  sendEvent("action", {
                    type: "browsing",
                    label: `Reading: ${displayUrl}...`,
                    status: "completed",
                  });

                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: `# ${browseResult.title || "Page Content"}\nURL: ${url}\n${focus ? `\nLooking for: ${focus}\n` : ""}\n${browseResult.content}`,
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
                    content: "Failed to load this page. Try search results or a different URL.",
                  });
                }

              } else if (functionName === "analyze_and_extract") {
                const rawData = args.raw_data || "";
                const analysisType = args.analysis_type || "summarize";
                const context = args.context || "";

                sendEvent("action", {
                  type: "thinking",
                  label: `Analyzing: ${analysisType}...`,
                  status: "running",
                });

                // The LLM will naturally analyze in its response
                sendEvent("action", {
                  type: "thinking",
                  label: `Analyzing: ${analysisType}...`,
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Analysis request recorded. Now synthesize these insights and use write_findings to document your ${analysisType} analysis.`,
                });

              } else if (functionName === "validate_information") {
                const claim = args.claim || "";
                const source = args.source;

                sendEvent("action", {
                  type: "searching",
                  label: "Validating information...",
                  status: "running",
                });

                const validation = await validateInformation(claim, source);

                sendEvent("action", {
                  type: "search_complete",
                  label: `Validation: ${validation.confidence} confidence`,
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Validation Result:\n- Confidence: ${validation.confidence}\n- Evidence: ${validation.evidence}\n\nUse this to inform your findings.`,
                });

              } else if (functionName === "self_evaluate") {
                const whatFound = args.what_i_found || "";
                const quality = args.quality_assessment || "good";
                const gaps = args.gaps || "";
                const nextAction = args.next_action || "complete";

                sendEvent("action", {
                  type: "thinking",
                  label: `Self-evaluation: ${quality}`,
                  status: "completed",
                });

                let response = `Self-Evaluation Complete:\n- Quality: ${quality}\n- Gaps: ${gaps || "None identified"}\n`;

                if (quality === "needs_more_research" || quality === "insufficient") {
                  response += `\nRecommendation: Continue research to address gaps.`;
                } else if (!hasWrittenFindings) {
                  response += `\nReminder: Use write_findings to document your research before finishing.`;
                } else {
                  response += `\nYou may conclude this step.`;
                }

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: response,
                });

              } else if (functionName === "write_findings") {
                const heading = args.heading || "Findings";
                const content = args.content || "";
                const confidence = args.confidence || "medium";
                const sources = args.sources || [];

                sendEvent("action", {
                  type: "writing",
                  label: `Writing: "${heading}"`,
                  status: "running",
                });

                let newSection = `\n## ${heading}\n\n${content}\n`;

                if (sources.length > 0) {
                  newSection += `\n**Sources:** ${sources.join(", ")}\n`;
                }

                if (confidence !== "high") {
                  newSection += `\n*Confidence: ${confidence}*\n`;
                }

                newFindingsContent += newSection;
                hasWrittenFindings = true;

                sendEvent("findings", newSection);

                sendEvent("action", {
                  type: "writing",
                  label: `Writing: "${heading}"`,
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Added "${heading}" to findings. ${!args.sources?.length ? "Remember to include source URLs when available." : ""}`,
                });
              }
            }
          } else {
            // No more tool calls - check if we should continue
            if (!hasWrittenFindings && iterations < maxIterations - 1) {
              // Encourage the agent to write findings
              messages.push({
                role: "user",
                content: "You haven't documented your findings yet. Please use write_findings to add your research to the report.",
              });
            } else {
              continueLoop = false;
            }
          }

          if (choice.finish_reason === "stop" && hasWrittenFindings) {
            continueLoop = false;
          }
        }

        sendEvent("action", {
          type: "complete",
          label: `Step ${stepIndex + 1} complete`,
          status: "completed",
        });

        sendEvent("done", {
          newFindings: newFindingsContent,
          searchResults: latestSearchResults,
          iterations,
        });

      } catch (error) {
        console.error("Agent execute error:", error);

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
