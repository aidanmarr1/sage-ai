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

    // DuckDuckGo Instant Answer API - free, no key needed, returns JSON
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(ddgUrl, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("DuckDuckGo API failed");
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // Abstract (main answer)
    if (data.Abstract && data.AbstractURL) {
      results.push({
        title: data.Heading || "Summary",
        url: data.AbstractURL,
        content: data.Abstract,
      });
    }

    // Related topics
    if (data.RelatedTopics) {
      for (const topic of data.RelatedTopics.slice(0, 5)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
            url: topic.FirstURL,
            content: topic.Text,
          });
        }
        // Handle nested topics
        if (topic.Topics) {
          for (const subtopic of topic.Topics.slice(0, 2)) {
            if (subtopic.Text && subtopic.FirstURL) {
              results.push({
                title: subtopic.Text.split(" - ")[0] || subtopic.Text.substring(0, 50),
                url: subtopic.FirstURL,
                content: subtopic.Text,
              });
            }
          }
        }
      }
    }

    // If no results from instant answers, return empty but don't fail
    return NextResponse.json({
      results: results.slice(0, 6),
      query,
    } as SearchResponse);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
