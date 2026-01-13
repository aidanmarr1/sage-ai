import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// DuckDuckGo HTML search endpoint (free, no API key needed)
const DUCKDUCKGO_URL = "https://html.duckduckgo.com/html/";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

// Parse DuckDuckGo HTML response
function parseDuckDuckGoResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks
  const resultRegex = /<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < 6) {
    const url = match[1];
    const title = match[2].trim();
    const snippet = match[3]
      .replace(/<\/?b>/g, "") // Remove bold tags
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#x27;/g, "'")
      .trim();

    if (url && title && !url.includes("duckduckgo.com")) {
      results.push({ title, url, content: snippet });
    }
  }

  // Fallback: try simpler pattern if above didn't work
  if (results.length === 0) {
    const simpleRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>[\s\S]*?<a class="result__a"[^>]*>([^<]+)<\/a>/g;
    while ((match = simpleRegex.exec(html)) !== null && results.length < 6) {
      const url = match[1];
      const title = match[2].trim();
      if (url && title) {
        results.push({ title, url, content: "" });
      }
    }
  }

  return results;
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

    // Call DuckDuckGo HTML search (free, no API key)
    const response = await fetch(DUCKDUCKGO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (compatible; SageAI/1.0)",
      },
      body: new URLSearchParams({ q: query }),
    });

    if (!response.ok) {
      console.error("DuckDuckGo search error:", response.status);
      return NextResponse.json(
        { error: "Search failed" },
        { status: response.status }
      );
    }

    const html = await response.text();
    const results = parseDuckDuckGoResults(html);

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
