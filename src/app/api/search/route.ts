import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
  source?: string;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  source?: string;
}

// Get favicon URL for a domain
function getFavicon(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return undefined;
  }
}

// Clean HTML tags from text
function cleanHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Brave Search API (free tier: 2000 queries/month)
async function searchWithBrave(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.web?.results || []).map((r: { title: string; url: string; description?: string }) => ({
      title: cleanHtml(r.title || ''),
      url: r.url,
      content: cleanHtml(r.description || ''),
      favicon: getFavicon(r.url),
      source: 'brave',
    }));
  } catch {
    return [];
  }
}

// SearXNG public instances
async function searchWithSearXNG(query: string): Promise<SearchResult[]> {
  const instances = [
    'https://search.sapti.me',
    'https://searx.be',
    'https://search.ononoki.org',
    'https://searx.tiekoetter.com',
    'https://search.bus-hit.me',
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; SageAI/1.0)',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const results: SearchResult[] = (data.results || [])
        .slice(0, 10)
        .filter((r: { url?: string }) => r.url && !r.url.startsWith('/'))
        .map((r: { title: string; url: string; content?: string }) => ({
          title: cleanHtml(r.title || ''),
          url: r.url,
          content: cleanHtml(r.content || ''),
          favicon: getFavicon(r.url),
          source: 'searxng',
        }));

      if (results.length >= 3) return results;
    } catch {
      continue;
    }
  }
  return [];
}

// DuckDuckGo HTML parsing
async function searchWithDuckDuckGo(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return [];

    const html = await response.text();
    const results: SearchResult[] = [];

    // Parse DuckDuckGo result links
    const resultPattern = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]*(?:<[^>]*>[^<]*)*)<\/a>/gi;
    const snippetPattern = /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: { url: string; title: string }[] = [];
    let match;

    while ((match = resultPattern.exec(html)) !== null) {
      const rawUrl = match[1];
      // DuckDuckGo wraps URLs, extract the actual URL
      let url = rawUrl;
      if (rawUrl.includes('uddg=')) {
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
          url = decodeURIComponent(uddgMatch[1]);
        }
      }

      if (url && url.startsWith('http')) {
        links.push({
          url,
          title: cleanHtml(match[2]),
        });
      }
    }

    // Get snippets
    const snippets: string[] = [];
    while ((match = snippetPattern.exec(html)) !== null) {
      snippets.push(cleanHtml(match[1]));
    }

    // Combine links with snippets
    for (let i = 0; i < Math.min(links.length, 10); i++) {
      results.push({
        title: links[i].title,
        url: links[i].url,
        content: snippets[i] || '',
        favicon: getFavicon(links[i].url),
        source: 'duckduckgo',
      });
    }

    return results;
  } catch (error) {
    console.error('DuckDuckGo search error:', error);
    return [];
  }
}

// Google Custom Search (free tier: 100 queries/day)
async function searchWithGoogle(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) return [];

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || []).map((r: { title: string; link: string; snippet?: string }) => ({
      title: cleanHtml(r.title || ''),
      url: r.link,
      content: cleanHtml(r.snippet || ''),
      favicon: getFavicon(r.link),
      source: 'google',
    }));
  } catch {
    return [];
  }
}

// Serper API (if configured)
async function searchWithSerper(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: 10 }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.organic || []).map((r: { title: string; link: string; snippet?: string }) => ({
      title: cleanHtml(r.title || ''),
      url: r.link,
      content: cleanHtml(r.snippet || ''),
      favicon: getFavicon(r.link),
      source: 'serper',
    }));
  } catch {
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

    // Try search providers in order of preference
    // 1. Paid APIs (most reliable)
    // 2. Free APIs with limits
    // 3. Public instances

    let results: SearchResult[] = [];
    let source = 'none';

    // Try Serper first (if configured)
    if (results.length < 3) {
      results = await searchWithSerper(query);
      if (results.length >= 3) source = 'serper';
    }

    // Try Brave (free tier)
    if (results.length < 3) {
      results = await searchWithBrave(query);
      if (results.length >= 3) source = 'brave';
    }

    // Try Google Custom Search (free tier)
    if (results.length < 3) {
      results = await searchWithGoogle(query);
      if (results.length >= 3) source = 'google';
    }

    // Try SearXNG public instances
    if (results.length < 3) {
      results = await searchWithSearXNG(query);
      if (results.length >= 3) source = 'searxng';
    }

    // Fallback to DuckDuckGo
    if (results.length < 3) {
      results = await searchWithDuckDuckGo(query);
      if (results.length > 0) source = 'duckduckgo';
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    results = results.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

    return NextResponse.json({
      results: results.slice(0, 10),
      query,
      source,
    } as SearchResponse);

  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
