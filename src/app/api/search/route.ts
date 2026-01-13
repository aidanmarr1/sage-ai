import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
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

    // Wikipedia API - completely free, no key needed, returns actual results
    const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5&origin=*`;

    const searchResponse = await fetch(wikiSearchUrl, {
      headers: { "Accept": "application/json" },
    });

    if (!searchResponse.ok) {
      throw new Error("Wikipedia API failed");
    }

    const searchData = await searchResponse.json();
    const searchResults = searchData.query?.search || [];

    if (searchResults.length === 0) {
      return NextResponse.json({ results: [], query } as SearchResponse);
    }

    // Get page extracts for the found articles
    const pageIds = searchResults.map((r: { pageid: number }) => r.pageid).join("|");
    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${pageIds}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;

    const extractResponse = await fetch(extractUrl, {
      headers: { "Accept": "application/json" },
    });

    const extractData = await extractResponse.json();
    const pages = extractData.query?.pages || {};

    const results: SearchResult[] = [];

    for (const result of searchResults) {
      const page = pages[result.pageid];
      const extract = page?.extract || result.snippet?.replace(/<[^>]*>/g, "") || "";

      results.push({
        title: result.title,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, "_"))}`,
        content: extract.substring(0, 500) + (extract.length > 500 ? "..." : ""),
      });
    }

    return NextResponse.json({ results, query } as SearchResponse);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
