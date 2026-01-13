import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = "https://api.tavily.com/search";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
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

    if (!TAVILY_API_KEY) {
      console.error("TAVILY_API_KEY is not configured");
      return NextResponse.json(
        { error: "Search service not configured" },
        { status: 500 }
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

    // Call Tavily API
    const response = await fetch(TAVILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: "basic",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: 6,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Tavily API error:", error);
      return NextResponse.json(
        { error: "Search failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Transform Tavily response to our format
    const results: SearchResult[] = (data.results || []).map((result: {
      title: string;
      url: string;
      content: string;
      score: number;
    }) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
    }));

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
