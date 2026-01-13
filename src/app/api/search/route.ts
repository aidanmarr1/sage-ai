import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// List of public SearXNG instances (free, no API key needed)
const SEARXNG_INSTANCES = [
  "https://search.sapti.me",
  "https://searx.be",
  "https://search.bus-hit.me",
  "https://searx.tiekoetter.com",
  "https://search.ononoki.org",
];

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

async function trySearchInstance(instance: string, query: string): Promise<SearchResult[]> {
  const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;

  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (compatible; SageAI/1.0)",
    },
    signal: AbortSignal.timeout(8000), // 8 second timeout
  });

  if (!response.ok) {
    throw new Error(`Instance ${instance} returned ${response.status}`);
  }

  const data = await response.json();

  return (data.results || []).slice(0, 6).map((r: { title?: string; url?: string; content?: string }) => ({
    title: r.title || "",
    url: r.url || "",
    content: r.content || "",
  }));
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

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Try each SearXNG instance until one works
    let results: SearchResult[] = [];
    let lastError: Error | null = null;

    for (const instance of SEARXNG_INSTANCES) {
      try {
        results = await trySearchInstance(instance, query);
        if (results.length > 0) {
          break; // Found results, stop trying
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.log(`SearXNG instance ${instance} failed, trying next...`);
        continue;
      }
    }

    if (results.length === 0 && lastError) {
      console.error("All SearXNG instances failed:", lastError.message);
    }

    return NextResponse.json({
      results,
      query,
    } as SearchResponse);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
