import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getSourceAuthority, type SourceAuthority } from "@/lib/source-quality";
import Browserbase from "@browserbasehq/sdk";
import { chromium, type Browser, type Page } from "playwright-core";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const BROWSERBASE_API_KEY = process.env.BROWSERBASE_API_KEY;
const BROWSERBASE_PROJECT_ID = process.env.BROWSERBASE_PROJECT_ID;

// Browserbase client for cloud browser sessions
const browserbase = BROWSERBASE_API_KEY
  ? new Browserbase({ apiKey: BROWSERBASE_API_KEY })
  : null;

// Active browser session management
let activeBrowser: Browser | null = null;
let activePage: Page | null = null;
let activeSessionId: string | null = null;

// ============================================================================
// ENHANCED TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  // Enhanced reasoning with structured chain-of-thought
  {
    type: "function",
    function: {
      name: "reason",
      description: "Think through the problem using structured chain-of-thought. ALWAYS use this first to plan your approach. Quality thinking leads to quality results.",
      parameters: {
        type: "object",
        properties: {
          observation: {
            type: "string",
            description: "What do I currently know? What information do I have so far?",
          },
          analysis: {
            type: "string",
            description: "What patterns do I see? What does this information mean?",
          },
          hypothesis: {
            type: "string",
            description: "What might the answer be? What gaps exist in my knowledge?",
          },
          next_action: {
            type: "string",
            description: "What specific action will I take next and why?",
          },
          alternatives: {
            type: "array",
            items: { type: "string" },
            description: "What other approaches could I take if this doesn't work?",
          },
        },
        required: ["observation", "analysis", "next_action"],
      },
    },
  },

  // Goal tracking for maintaining focus
  {
    type: "function",
    function: {
      name: "track_progress",
      description: "Track progress toward the task goal. Use to maintain focus, identify what's left, and assess confidence.",
      parameters: {
        type: "object",
        properties: {
          original_goal: {
            type: "string",
            description: "Restate the user's original goal",
          },
          completed: {
            type: "array",
            items: { type: "string" },
            description: "What has been accomplished so far",
          },
          remaining: {
            type: "array",
            items: { type: "string" },
            description: "What still needs to be done",
          },
          blockers: {
            type: "array",
            items: { type: "string" },
            description: "Any obstacles or missing information",
          },
          confidence: {
            type: "number",
            description: "0-100 confidence in achieving the goal with current progress",
          },
        },
        required: ["original_goal", "remaining", "confidence"],
      },
    },
  },

  // Dynamic plan modification
  {
    type: "function",
    function: {
      name: "modify_plan",
      description: "Modify the execution plan based on discoveries. Use when research reveals the current approach needs adjustment.",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["add_step", "remove_step", "modify_current"],
            description: "Type of plan modification",
          },
          target_step_index: {
            type: "number",
            description: "Index of step to modify (for remove_step)",
          },
          new_content: {
            type: "string",
            description: "New step content (for add_step or modify_current)",
          },
          reason: {
            type: "string",
            description: "Why this modification is needed based on current findings",
          },
        },
        required: ["action", "reason"],
      },
    },
  },

  // Web search with query expansion
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for current information. Returns results with authority scores. Use specific, targeted queries for best results.",
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

  // Deep multi-aspect search
  {
    type: "function",
    function: {
      name: "deep_search",
      description: "Perform a comprehensive search by running multiple related queries. Use when you need thorough coverage or initial results are insufficient.",
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

  // Website browsing
  {
    type: "function",
    function: {
      name: "browse_website",
      description: "Extract full content from a webpage. Use when search snippets aren't enough. Only browse 1-2 most relevant high-authority sources per step.",
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

  // Analysis and extraction
  {
    type: "function",
    function: {
      name: "analyze_and_extract",
      description: "Analyze collected information to extract key insights, patterns, and structured data. Use after gathering raw information.",
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

  // Enhanced validation with multi-source checking
  {
    type: "function",
    function: {
      name: "validate_information",
      description: "Cross-check and validate information using multiple high-authority sources. ALWAYS use for claims with numbers, dates, or statistics.",
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
          importance: {
            type: "string",
            enum: ["critical", "important", "minor"],
            description: "How important is this claim to the overall research",
          },
        },
        required: ["claim", "importance"],
      },
    },
  },

  // Write findings with confidence
  {
    type: "function",
    function: {
      name: "write_findings",
      description: "Document research findings. Use markdown formatting. ALWAYS include inline citations [Source](URL) for every claim.",
      parameters: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description: "Section heading",
          },
          content: {
            type: "string",
            description: "Detailed markdown content with inline citations [Source](URL) for each fact",
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Confidence level: 'high' = multiple authoritative sources, 'medium' = single good source, 'low' = uncertain/conflicting",
          },
          sources: {
            type: "array",
            items: { type: "string" },
            description: "URLs of sources used for this section",
          },
        },
        required: ["heading", "content", "confidence"],
      },
    },
  },

  // Enhanced self-evaluation with metrics
  {
    type: "function",
    function: {
      name: "self_evaluate",
      description: "Evaluate research quality with specific metrics. Use before finishing to ensure quality.",
      parameters: {
        type: "object",
        properties: {
          what_i_found: {
            type: "string",
            description: "Summary of what you've discovered",
          },
          quality_metrics: {
            type: "object",
            properties: {
              source_diversity: { type: "number", description: "1-5: How many different types of sources?" },
              fact_verification: { type: "number", description: "1-5: How well verified are key facts?" },
              completeness: { type: "number", description: "1-5: How complete is the coverage?" },
              actionability: { type: "number", description: "1-5: How actionable is the information?" },
            },
            description: "Quality metrics on 1-5 scale",
          },
          critical_gaps: {
            type: "array",
            items: { type: "string" },
            description: "Most important missing information",
          },
          recommendation: {
            type: "string",
            enum: ["complete", "one_more_search", "need_validation", "need_deeper_research", "modify_plan"],
            description: "What to do next",
          },
        },
        required: ["what_i_found", "quality_metrics", "recommendation"],
      },
    },
  },
];

// ============================================================================
// ENHANCED SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are Sage, an elite AI research agent with advanced reasoning and verification capabilities.

## Core Principles

1. **Think First**: ALWAYS use 'reason' tool first with structured chain-of-thought
2. **Verify Facts**: Use 'validate_information' for ANY claim with numbers, dates, or statistics
3. **Track Progress**: Use 'track_progress' to maintain focus on the goal
4. **Adapt Plans**: Use 'modify_plan' when discoveries reveal better approaches
5. **Cite Everything**: Every fact must have inline citation [Source](URL)

## Tool Chains (Use These Patterns)

**Discovery Chain** (new topic):
reason → web_search → browse_website (1-2 high-authority sources) → write_findings

**Verification Chain** (claims with numbers/dates):
web_search → validate_information → write_findings (note confidence)

**Comprehensive Chain** (complex topics):
reason → deep_search → analyze_and_extract → self_evaluate → write_findings

**Refinement Chain** (incomplete info):
self_evaluate → track_progress → web_search (specific query) → write_findings

## Quality Standards

- ALWAYS include inline citations: "According to [Reuters](url), the figure is X"
- Note confidence levels: "confirmed by multiple sources" vs "single source suggests"
- Include specific numbers, dates, names when available
- Flag contradictions: "Source A says X, but Source B says Y"
- Prioritize high-authority sources (.gov, .edu, major news)

## Anti-Patterns (AVOID THESE)

- Searching the same query twice
- Browsing more than 2-3 URLs without writing findings
- Writing findings without any search
- Skipping validation for numerical/statistical claims
- Generic statements without citations
- Ignoring source authority (prefer .gov, .edu, major news)

## Source Authority Guide

- **High (80+)**: .gov, .edu, Reuters, AP, Nature, BBC, major newspapers
- **Medium (50-79)**: Wikipedia, tech sites, regional news
- **Low (<50)**: Blogs, social media, user-generated content

Always prefer high-authority sources. Note when relying on lower-authority sources.`;

// ============================================================================
// INTERFACES
// ============================================================================

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
  authority?: SourceAuthority;
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

// ============================================================================
// SMART TOOL SELECTION
// ============================================================================

function determineToolChoice(
  iteration: number,
  previousTools: string[],
  hasFindings: boolean,
  maxIterations: number
): "auto" | "required" | { type: "function"; function: { name: string } } {
  // First iteration: always require reasoning
  if (iteration === 1) {
    return { type: "function", function: { name: "reason" } };
  }

  // Second iteration: encourage search if no search yet
  if (iteration === 2 && !previousTools.some(t => t.includes("search"))) {
    return "required"; // Require some tool, likely search
  }

  // Near end without findings: require write_findings
  if (iteration >= maxIterations - 2 && !hasFindings) {
    return { type: "function", function: { name: "write_findings" } };
  }

  // Last iteration: must write or complete
  if (iteration === maxIterations - 1 && !hasFindings) {
    return { type: "function", function: { name: "write_findings" } };
  }

  return "auto";
}

// ============================================================================
// DYNAMIC ITERATION LIMITS
// ============================================================================

function getMaxIterations(stepContent: string): number {
  const content = stepContent.toLowerCase();
  let base = 6; // Increased base from 8 to allow more thorough research

  // Complex research tasks need more iterations
  if (content.includes("comprehensive") || content.includes("thorough") || content.includes("detailed")) {
    base += 3;
  }
  if (content.includes("verify") || content.includes("validate") || content.includes("fact-check")) {
    base += 2;
  }
  if (content.includes("compare") || content.includes("analyze") || content.includes("contrast")) {
    base += 2;
  }
  if (content.includes("research") || content.includes("investigate")) {
    base += 1;
  }

  // Cap at reasonable maximum
  return Math.min(base, 12);
}

// ============================================================================
// SEARCH FUNCTIONS WITH AUTHORITY SCORING
// ============================================================================

async function executeSearch(query: string, searchType?: string): Promise<{ results: SearchResult[] }> {
  if (!SERPER_API_KEY) {
    console.error("SERPER_API_KEY not configured");
    return { results: [] };
  }

  try {
    // Query expansion based on search type
    let adjustedQuery = query;
    if (searchType === "news") {
      adjustedQuery = `${query} latest news 2024 2025`;
    } else if (searchType === "academic") {
      adjustedQuery = `${query} research study peer-reviewed`;
    } else if (searchType === "comparison") {
      adjustedQuery = `${query} vs comparison review`;
    }

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: adjustedQuery,
        num: searchType === "news" ? 12 : 10, // More results for better coverage
      }),
    });

    if (!response.ok) {
      console.error("Serper API error:", response.status);
      return { results: [] };
    }

    const data = await response.json();
    const organic = data.organic || [];

    const results: SearchResult[] = organic.map((r: { title: string; link: string; snippet: string }) => {
      let favicon: string | undefined;
      try {
        const hostname = new URL(r.link).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      } catch {
        favicon = undefined;
      }

      // Add authority scoring
      const authority = getSourceAuthority(r.link);

      return {
        title: r.title,
        url: r.link,
        content: r.snippet || "",
        favicon,
        authority,
      };
    });

    // Sort by authority score (highest first)
    results.sort((a, b) => (b.authority?.score || 0) - (a.authority?.score || 0));

    return { results };
  } catch (error) {
    console.error("Search error:", error);
    return { results: [] };
  }
}

async function executeDeepSearch(
  mainTopic: string,
  aspects: string[]
): Promise<{ results: SearchResult[]; summary: string }> {
  const allResults: SearchResult[] = [];
  const seenUrls = new Set<string>();

  // Search for each aspect in parallel for speed
  const searchPromises = aspects.slice(0, 4).map(aspect => {
    const query = `${mainTopic} ${aspect}`;
    return executeSearch(query);
  });

  const searchResults = await Promise.all(searchPromises);

  // Combine and deduplicate
  for (const result of searchResults) {
    for (const r of result.results) {
      if (!seenUrls.has(r.url)) {
        seenUrls.add(r.url);
        allResults.push(r);
      }
    }
  }

  // Sort by authority
  allResults.sort((a, b) => (b.authority?.score || 0) - (a.authority?.score || 0));

  return {
    results: allResults.slice(0, 18), // More results for comprehensive coverage
    summary: `Found ${allResults.length} unique results across ${aspects.length} aspects of "${mainTopic}"`,
  };
}

// ============================================================================
// PAGE BROWSING
// ============================================================================

// Helper to get or create a Browserbase session
async function getOrCreateBrowserSession(
  onUpdate?: (status: string, data?: Record<string, unknown>) => void
): Promise<{ browser: Browser; page: Page; sessionId: string; liveViewUrl: string } | null> {
  if (!browserbase || !BROWSERBASE_PROJECT_ID) {
    console.error("Browserbase not configured");
    return null;
  }

  try {
    // Reuse existing session if available
    if (activeBrowser && activePage && activeSessionId) {
      const debugInfo = await browserbase.sessions.debug(activeSessionId);
      return {
        browser: activeBrowser,
        page: activePage,
        sessionId: activeSessionId,
        liveViewUrl: debugInfo.debuggerFullscreenUrl,
      };
    }

    // Create a new session
    onUpdate?.("creating_session");
    const session = await browserbase.sessions.create({
      projectId: BROWSERBASE_PROJECT_ID,
      browserSettings: {
        solveCaptchas: true,
      },
    });

    // Get live view URL for real-time viewing
    const debugInfo = await browserbase.sessions.debug(session.id);
    const liveViewUrl = debugInfo.debuggerFullscreenUrl;

    // Notify frontend of live view URL
    onUpdate?.("session_ready", { liveViewUrl, sessionId: session.id });

    // Connect via Playwright
    const browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context.pages()[0];

    // Store for reuse
    activeBrowser = browser;
    activePage = page;
    activeSessionId = session.id;

    return { browser, page, sessionId: session.id, liveViewUrl };
  } catch (error) {
    console.error("Failed to create browser session:", error);
    return null;
  }
}

// Close the active browser session
async function closeBrowserSession() {
  if (activeBrowser) {
    try {
      await activeBrowser.close();
    } catch (e) {
      // Ignore close errors
    }
    activeBrowser = null;
    activePage = null;
    activeSessionId = null;
  }
}

async function browsePage(
  url: string,
  focus?: string,
  onUpdate?: (status: string, data?: Record<string, unknown>) => void
): Promise<{ content: string; title?: string; liveViewUrl?: string } | null> {
  try {
    onUpdate?.("loading");

    // Get or create a Browserbase session
    const session = await getOrCreateBrowserSession(onUpdate);
    if (!session) {
      // Fallback to simple fetch if Browserbase isn't configured
      return await simplePageFetch(url);
    }

    const { page, liveViewUrl } = session;

    // Navigate to the URL
    onUpdate?.("navigating", { url, liveViewUrl });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait a bit for dynamic content
    await page.waitForTimeout(2000);

    // Get the page title
    const title = await page.title();

    // Extract content - get text content for LLM processing
    let content = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll("script, style, noscript");
      scripts.forEach((el) => el.remove());

      // Get main content areas first, fallback to body
      const mainContent =
        document.querySelector("main, article, [role='main']") || document.body;

      // Get text content with some structure preserved
      const getText = (el: Element): string => {
        const tagName = el.tagName.toLowerCase();

        // Headers
        if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)) {
          return `\n\n${"#".repeat(parseInt(tagName[1]))} ${el.textContent?.trim()}\n`;
        }

        // Paragraphs and divs
        if (["p", "div", "section"].includes(tagName)) {
          const text = el.textContent?.trim();
          if (text && text.length > 10) {
            return `\n${text}\n`;
          }
        }

        // Lists
        if (tagName === "li") {
          return `\n- ${el.textContent?.trim()}`;
        }

        // Links
        if (tagName === "a") {
          const href = (el as HTMLAnchorElement).href;
          const text = el.textContent?.trim();
          if (text && href) {
            return `[${text}](${href})`;
          }
        }

        return el.textContent?.trim() || "";
      };

      return getText(mainContent);
    });

    onUpdate?.("complete", { liveViewUrl });

    // Truncate if too long
    if (content.length > 15000) {
      content = content.substring(0, 15000) + "\n\n[Content truncated for length...]";
    }

    return { content, title, liveViewUrl };
  } catch (error) {
    console.error("Browserbase browse error:", error);
    onUpdate?.("error");
    // Try simple fetch as fallback
    return await simplePageFetch(url);
  }
}

// Simple fallback fetch without browser
async function simplePageFetch(url: string): Promise<{ content: string; title?: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SageBot/1.0)",
      },
    });
    if (!response.ok) return null;

    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Basic HTML to text conversion
    let content = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (content.length > 15000) {
      content = content.substring(0, 15000) + "\n\n[Content truncated...]";
    }

    return { content, title };
  } catch {
    return null;
  }
}

// ============================================================================
// ENHANCED VALIDATION
// ============================================================================

async function validateInformation(
  claim: string,
  importance: string,
  originalSource?: string
): Promise<{ isValid: boolean; confidence: string; evidence: string; sources: string[] }> {
  // More thorough validation for important claims
  const queries = [
    `"${claim.substring(0, 50)}" verify`,
    importance === "critical" ? `${claim.substring(0, 40)} fact check` : null,
  ].filter(Boolean) as string[];

  const allResults: SearchResult[] = [];

  for (const query of queries) {
    const searchResults = await executeSearch(query);
    allResults.push(...searchResults.results);
  }

  // Filter to high-authority sources only for validation
  const highAuthorityResults = allResults.filter(r => (r.authority?.score || 0) >= 70);

  // Check for confirmation
  const confirmingSources = highAuthorityResults.filter(r =>
    r.content.toLowerCase().includes(claim.toLowerCase().substring(0, 25))
  );

  if (confirmingSources.length >= 2) {
    return {
      isValid: true,
      confidence: "high",
      evidence: `Confirmed by ${confirmingSources.length} authoritative sources`,
      sources: confirmingSources.slice(0, 3).map(s => s.url),
    };
  } else if (confirmingSources.length === 1) {
    return {
      isValid: true,
      confidence: "medium",
      evidence: `Found 1 authoritative source: ${confirmingSources[0].title}`,
      sources: [confirmingSources[0].url],
    };
  }

  // Check lower authority if no high authority found
  const anyConfirming = allResults.filter(r =>
    r.content.toLowerCase().includes(claim.toLowerCase().substring(0, 25))
  );

  if (anyConfirming.length >= 2) {
    return {
      isValid: true,
      confidence: "low",
      evidence: `Found ${anyConfirming.length} sources, but none are highly authoritative`,
      sources: anyConfirming.slice(0, 2).map(s => s.url),
    };
  }

  return {
    isValid: false,
    confidence: "low",
    evidence: "Could not confirm with additional sources. Consider this unverified.",
    sources: [],
  };
}

// ============================================================================
// MAIN EXECUTION HANDLER
// ============================================================================

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

  // Dynamic iteration limit based on step complexity
  const maxIterations = getMaxIterations(step);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (type: string, data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
      };

      let newFindingsContent = "";
      let latestSearchResults: SearchResult[] = [];
      let currentReasoning = "";
      const usedTools: string[] = [];

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
1. First, use 'reason' to plan your approach with structured thinking
2. Use 'track_progress' to stay focused on the goal
3. Search and browse high-authority sources (prioritize .gov, .edu, major news)
4. Use 'validate_information' for any claims with numbers, dates, or statistics
5. Document findings with 'write_findings' - ALWAYS include inline citations
6. Use 'self_evaluate' before finishing to check quality

Execute this step thoroughly. Quality and accuracy over speed.`;

        const messages: ChatMessage[] = [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ];

        let continueLoop = true;
        let iterations = 0;
        let hasWrittenFindings = false;

        sendEvent("action", {
          type: "thinking",
          label: `Analyzing step ${stepIndex + 1}...`,
          status: "completed",
        });

        while (continueLoop && iterations < maxIterations) {
          iterations++;

          // Smart tool selection based on context
          const toolChoice = determineToolChoice(iterations, usedTools, hasWrittenFindings, maxIterations);

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
              tool_choice: toolChoice,
              temperature: 0.7,
              max_tokens: 2500, // Increased for more detailed responses
            }),
          });

          if (!response.ok) {
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
              usedTools.push(functionName);
              let args;

              try {
                args = JSON.parse(toolCall.function.arguments);
              } catch {
                args = {};
              }

              // ----------------------------------------------------------------
              // TOOL: reason (enhanced)
              // ----------------------------------------------------------------
              if (functionName === "reason") {
                sendEvent("action", {
                  type: "thinking",
                  label: "Analyzing approach...",
                  status: "running",
                });

                const observation = args.observation || "";
                const analysis = args.analysis || "";
                const nextAction = args.next_action || "";
                currentReasoning = nextAction;

                // Send reasoning to UI for transparency
                sendEvent("reasoning", {
                  observation,
                  analysis,
                  nextAction,
                });

                sendEvent("action", {
                  type: "thinking",
                  label: "Analyzing approach...",
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Reasoning recorded:\n- Observation: ${observation}\n- Analysis: ${analysis}\n- Next: ${nextAction}\n\nNow execute your plan. Remember to cite sources.`,
                });

              // ----------------------------------------------------------------
              // TOOL: track_progress
              // ----------------------------------------------------------------
              } else if (functionName === "track_progress") {
                const goal = args.original_goal || "";
                const completed = args.completed || [];
                const remaining = args.remaining || [];
                const confidence = args.confidence || 50;

                sendEvent("action", {
                  type: "thinking",
                  label: `Progress: ${confidence}% confident`,
                  status: "completed",
                });

                sendEvent("progress", {
                  goal,
                  completed,
                  remaining,
                  confidence,
                });

                let guidance = `Progress tracked:\n- Completed: ${completed.length} items\n- Remaining: ${remaining.length} items\n- Confidence: ${confidence}%\n\n`;

                if (confidence < 50) {
                  guidance += "Confidence is low. Consider deeper research or different sources.";
                } else if (remaining.length === 0) {
                  guidance += "All items complete! Use write_findings to document your research.";
                } else {
                  guidance += `Focus on: ${remaining[0]}`;
                }

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: guidance,
                });

              // ----------------------------------------------------------------
              // TOOL: modify_plan
              // ----------------------------------------------------------------
              } else if (functionName === "modify_plan") {
                const action = args.action || "modify_current";
                const reason = args.reason || "";
                const newContent = args.new_content || "";

                sendEvent("action", {
                  type: "thinking",
                  label: `Plan adjustment: ${action}`,
                  status: "completed",
                });

                // Send plan modification event to UI
                sendEvent("planModification", {
                  action,
                  reason,
                  newContent,
                  stepIndex,
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Plan modification noted: ${action}\nReason: ${reason}\n\nContinue with the adjusted approach.`,
                });

              // ----------------------------------------------------------------
              // TOOL: web_search
              // ----------------------------------------------------------------
              } else if (functionName === "web_search") {
                const query = args.query || "";
                const searchType = args.search_type || "general";

                sendEvent("action", {
                  type: "searching",
                  label: `Searching: "${query.substring(0, 40)}${query.length > 40 ? "..." : ""}"`,
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

                // Format results with authority indicators
                const formattedResults = searchResults.results
                  .map((r, i) => {
                    const authorityLabel = r.authority?.tier === "high" ? "★ HIGH" :
                      r.authority?.tier === "medium" ? "◆ MED" : "○ LOW";
                    return `${i + 1}. [${authorityLabel}] **${r.title}**\n   URL: ${r.url}\n   ${r.content}`;
                  })
                  .join("\n\n");

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: formattedResults || "No results found. Try a different query.",
                });

              // ----------------------------------------------------------------
              // TOOL: deep_search
              // ----------------------------------------------------------------
              } else if (functionName === "deep_search") {
                const mainTopic = args.main_topic || "";
                const aspects = args.aspects || [];

                sendEvent("action", {
                  type: "searching",
                  label: `Deep research: "${mainTopic.substring(0, 35)}..."`,
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
                  .map((r, i) => {
                    const authorityLabel = r.authority?.tier === "high" ? "★ HIGH" :
                      r.authority?.tier === "medium" ? "◆ MED" : "○ LOW";
                    return `${i + 1}. [${authorityLabel}] **${r.title}**\n   URL: ${r.url}\n   ${r.content}`;
                  })
                  .join("\n\n");

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `${deepResults.summary}\n\n${formattedResults}`,
                });

              // ----------------------------------------------------------------
              // TOOL: browse_website
              // ----------------------------------------------------------------
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

                // Check source authority before browsing
                const authority = getSourceAuthority(url);

                sendEvent("action", {
                  type: "browsing",
                  label: `Reading: ${displayUrl}...`,
                  status: "running",
                });

                sendEvent("browserState", {
                  currentUrl: url,
                  isActive: true,
                  authority,
                  status: "loading",
                });

                const browseResult = await browsePage(url, focus, (status, data) => {
                  const browserUpdate: Record<string, unknown> = {
                    currentUrl: url,
                    isActive: status === "loading" || status === "navigating" || status === "creating_session",
                    status: status === "navigating" || status === "creating_session" ? "loading" : status,
                  };
                  // Include liveViewUrl and sessionId if provided
                  if (data?.liveViewUrl) {
                    browserUpdate.liveViewUrl = data.liveViewUrl as string;
                  }
                  if (data?.sessionId) {
                    browserUpdate.sessionId = data.sessionId as string;
                  }
                  sendEvent("browserState", browserUpdate);
                });

                if (browseResult) {
                  sendEvent("action", {
                    type: "browsing",
                    label: `Reading: ${displayUrl}...`,
                    status: "completed",
                  });

                  const authorityNote = authority.tier === "high" ? "High-authority source" :
                    authority.tier === "medium" ? "Medium-authority source" :
                    "Low-authority source - consider finding corroboration";

                  messages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: `# ${browseResult.title || "Page Content"}\nURL: ${url}\nAuthority: ${authorityNote}\n${focus ? `\nLooking for: ${focus}\n` : ""}\n${browseResult.content}`,
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

              // ----------------------------------------------------------------
              // TOOL: analyze_and_extract
              // ----------------------------------------------------------------
              } else if (functionName === "analyze_and_extract") {
                const analysisType = args.analysis_type || "summarize";

                sendEvent("action", {
                  type: "thinking",
                  label: `Analyzing: ${analysisType}...`,
                  status: "running",
                });

                sendEvent("action", {
                  type: "thinking",
                  label: `Analyzing: ${analysisType}...`,
                  status: "completed",
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Analysis request recorded. Now synthesize these insights and use write_findings to document your ${analysisType} analysis. Remember to include citations.`,
                });

              // ----------------------------------------------------------------
              // TOOL: validate_information (enhanced)
              // ----------------------------------------------------------------
              } else if (functionName === "validate_information") {
                const claim = args.claim || "";
                const source = args.source;
                const importance = args.importance || "important";

                sendEvent("action", {
                  type: "searching",
                  label: `Validating: "${claim.substring(0, 30)}..."`,
                  status: "running",
                });

                const validation = await validateInformation(claim, importance, source);

                sendEvent("action", {
                  type: "search_complete",
                  label: `Validation: ${validation.confidence} confidence`,
                  status: "completed",
                });

                // Send validation results to UI
                sendEvent("validation", {
                  claim,
                  confidence: validation.confidence,
                  isValid: validation.isValid,
                  sources: validation.sources,
                });

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: `Validation Result:\n- Confidence: ${validation.confidence}\n- Valid: ${validation.isValid}\n- Evidence: ${validation.evidence}\n- Sources: ${validation.sources.join(", ") || "None found"}\n\nInclude this confidence level when writing your findings.`,
                });

              // ----------------------------------------------------------------
              // TOOL: write_findings
              // ----------------------------------------------------------------
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

                // Build section with clear confidence indicators
                let newSection = `\n## ${heading}\n\n`;

                if (confidence === "high") {
                  newSection += `*✓ High confidence - verified by multiple authoritative sources*\n\n`;
                } else if (confidence === "low") {
                  newSection += `*⚠ Low confidence - limited verification*\n\n`;
                }

                newSection += `${content}\n`;

                if (sources.length > 0) {
                  newSection += `\n**Sources:** ${sources.join(", ")}\n`;
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
                  content: `Added "${heading}" to findings with ${confidence} confidence. ${sources.length === 0 ? "Note: No sources provided - please add inline citations to the content." : ""}`,
                });

              // ----------------------------------------------------------------
              // TOOL: self_evaluate (enhanced)
              // ----------------------------------------------------------------
              } else if (functionName === "self_evaluate") {
                const whatFound = args.what_i_found || "";
                const metrics = args.quality_metrics || {};
                const gaps = args.critical_gaps || [];
                const recommendation = args.recommendation || "complete";

                // Calculate average quality score
                const metricValues = Object.values(metrics).filter((v): v is number => typeof v === "number");
                const avgQuality = metricValues.length > 0
                  ? metricValues.reduce((a, b) => a + b, 0) / metricValues.length
                  : 3;

                const qualityLabel = avgQuality >= 4 ? "excellent" : avgQuality >= 3 ? "good" : "needs improvement";

                sendEvent("action", {
                  type: "thinking",
                  label: `Self-evaluation: ${qualityLabel}`,
                  status: "completed",
                });

                sendEvent("quality", {
                  metrics,
                  avgQuality,
                  gaps,
                  recommendation,
                });

                let guidance = `Self-Evaluation Complete:\n`;
                guidance += `- Overall Quality: ${qualityLabel} (${avgQuality.toFixed(1)}/5)\n`;
                guidance += `- Source Diversity: ${metrics.source_diversity || "?"}/5\n`;
                guidance += `- Fact Verification: ${metrics.fact_verification || "?"}/5\n`;
                guidance += `- Completeness: ${metrics.completeness || "?"}/5\n`;
                guidance += `- Gaps: ${gaps.length > 0 ? gaps.join(", ") : "None identified"}\n`;
                guidance += `- Recommendation: ${recommendation}\n\n`;

                if (recommendation === "complete" && hasWrittenFindings) {
                  guidance += "Research is complete. Good work!";
                } else if (!hasWrittenFindings) {
                  guidance += "IMPORTANT: Use write_findings to document your research before finishing.";
                } else if (recommendation !== "complete") {
                  guidance += `Action needed: ${recommendation}`;
                }

                messages.push({
                  role: "tool",
                  tool_call_id: toolCall.id,
                  content: guidance,
                });
              }
            }
          } else {
            // No tool calls - check if we should continue
            if (!hasWrittenFindings && iterations < maxIterations - 1) {
              messages.push({
                role: "user",
                content: "You haven't documented your findings yet. Please use write_findings to add your research to the report. Remember to include inline citations [Source](URL) for each fact.",
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
          maxIterations,
          toolsUsed: usedTools,
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
