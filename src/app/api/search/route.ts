import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

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

// Parse DuckDuckGo HTML search results
function parseDuckDuckGoResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // Match result blocks - DuckDuckGo uses specific class patterns
  const resultRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>[\s\S]*?<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < 10) {
    const url = match[1];
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    const content = match[3].replace(/<[^>]+>/g, '').trim();

    if (url && title && !url.startsWith('/')) {
      let favicon: string | undefined;
      try {
        const hostname = new URL(url).hostname;
        favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
      } catch {
        favicon = undefined;
      }

      results.push({ title, url, content, favicon });
    }
  }

  // Fallback parsing if the above didn't work
  if (results.length === 0) {
    // Try alternative pattern for newer DuckDuckGo HTML
    const altRegex = /<a[^>]*data-testid="result-title-a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<span[^>]*data-result="snippet"[^>]*>([\s\S]*?)<\/span>/gi;

    while ((match = altRegex.exec(html)) !== null && results.length < 10) {
      const url = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const content = match[3].replace(/<[^>]+>/g, '').trim();

      if (url && title && !url.startsWith('/')) {
        let favicon: string | undefined;
        try {
          const hostname = new URL(url).hostname;
          favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        } catch {
          favicon = undefined;
        }

        results.push({ title, url, content, favicon });
      }
    }
  }

  return results;
}

// Use SearXNG public instance as primary (more reliable JSON API)
async function searchWithSearXNG(query: string): Promise<SearchResult[]> {
  // List of public SearXNG instances that support JSON
  const instances = [
    'https://search.sapti.me',
    'https://searx.be',
    'https://search.ononoki.org',
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SageAI/1.0)',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const results: SearchResult[] = (data.results || []).slice(0, 10).map((r: { title: string; url: string; content?: string }) => {
        let favicon: string | undefined;
        try {
          const hostname = new URL(r.url).hostname;
          favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
        } catch {
          favicon = undefined;
        }

        return {
          title: r.title || '',
          url: r.url,
          content: r.content || '',
          favicon,
        };
      });

      if (results.length > 0) {
        return results;
      }
    } catch {
      // Try next instance
      continue;
    }
  }

  return [];
}

// Fallback to DuckDuckGo HTML scraping
async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo returned ${response.status}`);
    }

    const html = await response.text();
    return parseDuckDuckGoResults(html);
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
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

    // Try SearXNG first (more reliable), then fallback to DuckDuckGo
    let results = await searchWithSearXNG(query);

    if (results.length === 0) {
      results = await searchWithDuckDuckGo(query);
    }

    // If still no results, return empty with a note
    if (results.length === 0) {
      console.warn('No search results found for query:', query);
    }

    return NextResponse.json({ results, query } as SearchResponse);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
