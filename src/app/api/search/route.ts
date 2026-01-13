import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    if (!SERPER_API_KEY) {
      return NextResponse.json({ error: "Search service not configured" }, { status: 500 });
    }

    // Serper.dev - Real Google search results
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 8 }),
    });

    if (!response.ok) {
      throw new Error("Serper API failed");
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

      return {
        title: r.title,
        url: r.link,
        content: r.snippet || "",
        favicon,
      };
    });

    return NextResponse.json({ results, query } as SearchResponse);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
