/**
 * Research Memory System
 * Provides search caching, query deduplication, and topic tracking
 */

import type { SourceAuthority } from './source-quality';

export interface CachedSearchResult {
  title: string;
  url: string;
  content: string;
  favicon?: string;
  authority?: SourceAuthority;
}

export interface CachedSearch {
  query: string;
  normalizedQuery: string;
  results: CachedSearchResult[];
  timestamp: Date;
  searchType?: string;
}

export interface CachedPage {
  url: string;
  content: string;
  title?: string;
  timestamp: Date;
  authority?: SourceAuthority;
}

export interface TopicInfo {
  topic: string;
  confidence: number; // 0-100
  sources: string[];
  lastUpdated: Date;
  keyFacts: string[];
}

export interface ResearchMemorySummary {
  queriesCount: number;
  uniqueSourcesCount: number;
  topicsResearched: string[];
  highConfidenceTopics: string[];
  suggestedGaps: string[];
}

/**
 * Normalize a search query for comparison and caching
 */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .split(' ')
    .filter(w => w.length > 2) // Remove short words
    .sort() // Sort for consistent comparison
    .join(' ');
}

/**
 * Calculate word overlap between two queries (0-1)
 */
export function calculateQueryOverlap(query1: string, query2: string): number {
  const words1 = new Set(normalizeQuery(query1).split(' '));
  const words2 = new Set(normalizeQuery(query2).split(' '));

  if (words1.size === 0 || words2.size === 0) return 0;

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  return overlap / Math.max(words1.size, words2.size);
}

/**
 * Research Memory - maintains context across agent steps
 */
export class ResearchMemory {
  private searchCache: Map<string, CachedSearch> = new Map();
  private pageCache: Map<string, CachedPage> = new Map();
  private topics: Map<string, TopicInfo> = new Map();
  private allQueries: string[] = [];
  private allUrls: Set<string> = new Set();
  private validatedClaims: Map<string, { confidence: string; sources: string[] }> = new Map();

  private readonly cacheMaxAge: number;
  private readonly overlapThreshold: number;

  constructor(
    cacheMaxAgeMs: number = 30 * 60 * 1000, // 30 minutes
    overlapThreshold: number = 0.7 // 70% word overlap
  ) {
    this.cacheMaxAge = cacheMaxAgeMs;
    this.overlapThreshold = overlapThreshold;
  }

  // ============================================================================
  // SEARCH CACHE
  // ============================================================================

  /**
   * Check if we have a cached search for this query
   */
  getCachedSearch(query: string, searchType?: string): CachedSearch | null {
    const normalizedQuery = normalizeQuery(query);

    // Direct cache hit
    const cached = this.searchCache.get(normalizedQuery);
    if (cached && !this.isExpired(cached.timestamp)) {
      if (!searchType || cached.searchType === searchType) {
        return cached;
      }
    }

    // Check for similar queries
    for (const [key, cached] of this.searchCache.entries()) {
      if (this.isExpired(cached.timestamp)) continue;
      if (searchType && cached.searchType !== searchType) continue;

      const overlap = calculateQueryOverlap(query, cached.query);
      if (overlap >= this.overlapThreshold) {
        return cached;
      }
    }

    return null;
  }

  /**
   * Store search results in cache
   */
  cacheSearch(query: string, results: CachedSearchResult[], searchType?: string): void {
    const normalizedQuery = normalizeQuery(query);
    this.searchCache.set(normalizedQuery, {
      query,
      normalizedQuery,
      results,
      timestamp: new Date(),
      searchType,
    });
    this.allQueries.push(query);

    // Track URLs
    for (const result of results) {
      this.allUrls.add(result.url);
    }
  }

  /**
   * Check if a query is a duplicate or near-duplicate
   */
  isDuplicateQuery(query: string): { isDuplicate: boolean; similar?: string } {
    const cached = this.getCachedSearch(query);
    if (cached) {
      return { isDuplicate: true, similar: cached.query };
    }

    // Check against all previous queries
    for (const prevQuery of this.allQueries) {
      const overlap = calculateQueryOverlap(query, prevQuery);
      if (overlap >= this.overlapThreshold) {
        return { isDuplicate: true, similar: prevQuery };
      }
    }

    return { isDuplicate: false };
  }

  // ============================================================================
  // PAGE CACHE
  // ============================================================================

  /**
   * Check if we have cached content for a URL
   */
  getCachedPage(url: string): CachedPage | null {
    const cached = this.pageCache.get(url);
    if (cached && !this.isExpired(cached.timestamp)) {
      return cached;
    }
    return null;
  }

  /**
   * Store page content in cache
   */
  cachePage(url: string, content: string, title?: string, authority?: SourceAuthority): void {
    this.pageCache.set(url, {
      url,
      content,
      title,
      timestamp: new Date(),
      authority,
    });
    this.allUrls.add(url);
  }

  /**
   * Check if a URL has been visited
   */
  hasVisitedUrl(url: string): boolean {
    return this.pageCache.has(url);
  }

  // ============================================================================
  // TOPIC TRACKING
  // ============================================================================

  /**
   * Record that a topic has been researched
   */
  recordTopic(topic: string, confidence: number, sources: string[], keyFacts: string[] = []): void {
    const existing = this.topics.get(topic.toLowerCase());
    if (existing) {
      // Update existing topic with higher confidence and more sources
      existing.confidence = Math.max(existing.confidence, confidence);
      existing.sources = [...new Set([...existing.sources, ...sources])];
      existing.keyFacts = [...new Set([...existing.keyFacts, ...keyFacts])];
      existing.lastUpdated = new Date();
    } else {
      this.topics.set(topic.toLowerCase(), {
        topic,
        confidence,
        sources,
        keyFacts,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Get confidence level for a topic
   */
  getTopicConfidence(topic: string): number {
    return this.topics.get(topic.toLowerCase())?.confidence || 0;
  }

  /**
   * Check if a topic has been sufficiently researched
   */
  isTopicWellResearched(topic: string, minConfidence: number = 70, minSources: number = 2): boolean {
    const info = this.topics.get(topic.toLowerCase());
    if (!info) return false;
    return info.confidence >= minConfidence && info.sources.length >= minSources;
  }

  // ============================================================================
  // VALIDATION TRACKING
  // ============================================================================

  /**
   * Record a validated claim
   */
  recordValidatedClaim(claim: string, confidence: string, sources: string[]): void {
    const normalizedClaim = claim.toLowerCase().substring(0, 100);
    this.validatedClaims.set(normalizedClaim, { confidence, sources });
  }

  /**
   * Check if a claim has been validated
   */
  hasValidatedClaim(claim: string): boolean {
    const normalizedClaim = claim.toLowerCase().substring(0, 100);
    return this.validatedClaims.has(normalizedClaim);
  }

  /**
   * Get validation info for a claim
   */
  getValidationInfo(claim: string): { confidence: string; sources: string[] } | null {
    const normalizedClaim = claim.toLowerCase().substring(0, 100);
    return this.validatedClaims.get(normalizedClaim) || null;
  }

  // ============================================================================
  // SUMMARY AND CONTEXT
  // ============================================================================

  /**
   * Get summary of research memory for context
   */
  getSummary(): ResearchMemorySummary {
    const topicsArray = Array.from(this.topics.values());
    const highConfidenceTopics = topicsArray
      .filter(t => t.confidence >= 70)
      .map(t => t.topic);

    // Identify potential gaps based on low-confidence topics
    const suggestedGaps = topicsArray
      .filter(t => t.confidence < 50)
      .map(t => `Need more info on: ${t.topic}`);

    return {
      queriesCount: this.allQueries.length,
      uniqueSourcesCount: this.allUrls.size,
      topicsResearched: topicsArray.map(t => t.topic),
      highConfidenceTopics,
      suggestedGaps,
    };
  }

  /**
   * Generate context string for agent prompt
   */
  generateContextString(): string {
    const summary = this.getSummary();
    let context = '## Research Memory Summary\n\n';

    context += `**Searches performed:** ${summary.queriesCount}\n`;
    context += `**Unique sources found:** ${summary.uniqueSourcesCount}\n`;
    context += `**Validated claims:** ${this.validatedClaims.size}\n\n`;

    if (summary.highConfidenceTopics.length > 0) {
      context += `**Well-researched topics:** ${summary.highConfidenceTopics.join(', ')}\n\n`;
    }

    if (summary.suggestedGaps.length > 0) {
      context += `**Research gaps:**\n${summary.suggestedGaps.map(g => `- ${g}`).join('\n')}\n\n`;
    }

    // List recent queries to avoid duplicates
    const recentQueries = this.allQueries.slice(-5);
    if (recentQueries.length > 0) {
      context += `**Recent searches (avoid duplicates):**\n`;
      context += recentQueries.map(q => `- "${q}"`).join('\n');
      context += '\n';
    }

    return context;
  }

  /**
   * Get high-authority sources discovered
   */
  getHighAuthoritySources(): string[] {
    const highAuth: string[] = [];

    for (const [, search] of this.searchCache) {
      for (const result of search.results) {
        if (result.authority && result.authority.score >= 70) {
          if (!highAuth.includes(result.url)) {
            highAuth.push(result.url);
          }
        }
      }
    }

    for (const [url, page] of this.pageCache) {
      if (page.authority && page.authority.score >= 70) {
        if (!highAuth.includes(url)) {
          highAuth.push(url);
        }
      }
    }

    return highAuth;
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private isExpired(timestamp: Date): boolean {
    return Date.now() - timestamp.getTime() > this.cacheMaxAge;
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.searchCache.clear();
    this.pageCache.clear();
    this.topics.clear();
    this.allQueries = [];
    this.allUrls.clear();
    this.validatedClaims.clear();
  }

  /**
   * Get statistics for debugging
   */
  getStats(): {
    searchCacheSize: number;
    pageCacheSize: number;
    topicsCount: number;
    totalQueries: number;
    uniqueUrls: number;
    validatedClaimsCount: number;
  } {
    return {
      searchCacheSize: this.searchCache.size,
      pageCacheSize: this.pageCache.size,
      topicsCount: this.topics.size,
      totalQueries: this.allQueries.length,
      uniqueUrls: this.allUrls.size,
      validatedClaimsCount: this.validatedClaims.size,
    };
  }
}

/**
 * Create a singleton instance for use across the application
 */
let memoryInstance: ResearchMemory | null = null;

export function getResearchMemory(): ResearchMemory {
  if (!memoryInstance) {
    memoryInstance = new ResearchMemory();
  }
  return memoryInstance;
}

export function resetResearchMemory(): void {
  if (memoryInstance) {
    memoryInstance.clear();
  }
  memoryInstance = new ResearchMemory();
}
