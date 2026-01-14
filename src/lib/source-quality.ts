/**
 * Source Quality Assessment System
 * Provides domain authority scoring and source credibility evaluation
 */

// High authority domains (80-100)
const HIGH_AUTHORITY: Record<string, number> = {
  // Academic & Scientific
  'nature.com': 95,
  'science.org': 95,
  'sciencedirect.com': 92,
  'pubmed.ncbi.nlm.nih.gov': 95,
  'ncbi.nlm.nih.gov': 92,
  'arxiv.org': 88,
  'scholar.google.com': 85,
  'jstor.org': 90,
  'ieee.org': 90,
  'acm.org': 88,

  // News - Major Wire Services & Quality Journalism
  'reuters.com': 92,
  'apnews.com': 92,
  'bbc.com': 88,
  'bbc.co.uk': 88,
  'nytimes.com': 85,
  'washingtonpost.com': 85,
  'theguardian.com': 82,
  'economist.com': 88,
  'ft.com': 88,
  'wsj.com': 85,
  'bloomberg.com': 85,

  // Official Sources
  'who.int': 95,
  'cdc.gov': 95,
  'nih.gov': 95,
  'fda.gov': 92,
  'europa.eu': 90,
  'un.org': 90,
};

// Medium authority domains (50-79)
const MEDIUM_AUTHORITY: Record<string, number> = {
  // Reference & Educational
  'wikipedia.org': 72,
  'britannica.com': 80,
  'investopedia.com': 70,
  'healthline.com': 68,
  'webmd.com': 68,
  'mayoclinic.org': 82,

  // Tech & Professional
  'stackoverflow.com': 75,
  'github.com': 72,
  'docs.google.com': 65,
  'microsoft.com': 78,
  'apple.com': 78,
  'developer.mozilla.org': 85,

  // News - Regional & Digital Native
  'techcrunch.com': 72,
  'wired.com': 75,
  'arstechnica.com': 75,
  'theverge.com': 70,
  'cnn.com': 72,
  'npr.org': 80,
  'pbs.org': 82,
};

// Low authority domains (0-49)
const LOW_AUTHORITY: Record<string, number> = {
  // User-Generated Content
  'medium.com': 45,
  'substack.com': 48,
  'reddit.com': 40,
  'quora.com': 38,
  'answers.yahoo.com': 25,

  // Blogs & Personal Sites
  'blogspot.com': 35,
  'wordpress.com': 40,
  'tumblr.com': 30,
  'livejournal.com': 30,

  // Content Farms & Questionable
  'buzzfeed.com': 42,
  'huffpost.com': 55,
  'dailymail.co.uk': 40,
};

// TLD-based scoring
const TLD_SCORES: Record<string, number> = {
  'gov': 90,
  'edu': 85,
  'mil': 88,
  'org': 60, // Base, can be higher with known domain
  'int': 85,
  'ac.uk': 85,
  'gov.uk': 90,
};

export interface SourceAuthority {
  score: number;
  tier: 'high' | 'medium' | 'low' | 'unknown';
  category: SourceCategory;
  flags: SourceFlag[];
}

export type SourceCategory =
  | 'academic'
  | 'news_major'
  | 'news_regional'
  | 'government'
  | 'reference'
  | 'tech'
  | 'blog'
  | 'social'
  | 'commercial'
  | 'unknown';

export type SourceFlag =
  | 'primary_source'
  | 'peer_reviewed'
  | 'user_generated'
  | 'opinion'
  | 'sponsored'
  | 'dated'
  | 'paywalled';

/**
 * Get source authority score and metadata for a URL
 */
export function getSourceAuthority(url: string): SourceAuthority {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '');
    const tld = extractTLD(hostname);

    // Check known high authority domains
    for (const [domain, score] of Object.entries(HIGH_AUTHORITY)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return {
          score,
          tier: 'high',
          category: categorizeHighAuthority(domain),
          flags: getFlagsForDomain(domain),
        };
      }
    }

    // Check known medium authority domains
    for (const [domain, score] of Object.entries(MEDIUM_AUTHORITY)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return {
          score,
          tier: 'medium',
          category: categorizeMediumAuthority(domain),
          flags: getFlagsForDomain(domain),
        };
      }
    }

    // Check known low authority domains
    for (const [domain, score] of Object.entries(LOW_AUTHORITY)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return {
          score,
          tier: 'low',
          category: categorizeLowAuthority(domain),
          flags: getFlagsForDomain(domain),
        };
      }
    }

    // Check TLD-based scoring
    for (const [tldPattern, score] of Object.entries(TLD_SCORES)) {
      if (tld === tldPattern || hostname.endsWith('.' + tldPattern)) {
        return {
          score,
          tier: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
          category: tldPattern.includes('gov') ? 'government' : tldPattern.includes('edu') ? 'academic' : 'unknown',
          flags: [],
        };
      }
    }

    // Default scoring with heuristics
    return calculateDefaultScore(hostname, urlObj.pathname);

  } catch {
    return {
      score: 40,
      tier: 'unknown',
      category: 'unknown',
      flags: [],
    };
  }
}

/**
 * Extract TLD from hostname
 */
function extractTLD(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length >= 2) {
    // Handle compound TLDs like co.uk, com.au
    const lastTwo = parts.slice(-2).join('.');
    if (['co.uk', 'com.au', 'ac.uk', 'gov.uk', 'org.uk'].includes(lastTwo)) {
      return lastTwo;
    }
  }
  return parts[parts.length - 1];
}

/**
 * Categorize high authority domains
 */
function categorizeHighAuthority(domain: string): SourceCategory {
  const academic = ['nature.com', 'science.org', 'sciencedirect.com', 'pubmed', 'arxiv.org', 'jstor.org', 'ieee.org', 'acm.org'];
  const news = ['reuters.com', 'apnews.com', 'bbc', 'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'economist.com', 'ft.com', 'wsj.com', 'bloomberg.com'];
  const government = ['who.int', 'cdc.gov', 'nih.gov', 'fda.gov', 'europa.eu', 'un.org'];

  if (academic.some(a => domain.includes(a))) return 'academic';
  if (news.some(n => domain.includes(n))) return 'news_major';
  if (government.some(g => domain.includes(g))) return 'government';
  return 'reference';
}

/**
 * Categorize medium authority domains
 */
function categorizeMediumAuthority(domain: string): SourceCategory {
  const reference = ['wikipedia.org', 'britannica.com', 'investopedia.com', 'healthline.com', 'webmd.com', 'mayoclinic.org'];
  const tech = ['stackoverflow.com', 'github.com', 'microsoft.com', 'apple.com', 'developer.mozilla.org'];
  const news = ['techcrunch.com', 'wired.com', 'arstechnica.com', 'theverge.com', 'cnn.com', 'npr.org', 'pbs.org'];

  if (reference.some(r => domain.includes(r))) return 'reference';
  if (tech.some(t => domain.includes(t))) return 'tech';
  if (news.some(n => domain.includes(n))) return 'news_regional';
  return 'commercial';
}

/**
 * Categorize low authority domains
 */
function categorizeLowAuthority(domain: string): SourceCategory {
  const social = ['reddit.com', 'quora.com', 'answers.yahoo.com'];
  const blog = ['medium.com', 'substack.com', 'blogspot.com', 'wordpress.com', 'tumblr.com', 'livejournal.com'];

  if (social.some(s => domain.includes(s))) return 'social';
  if (blog.some(b => domain.includes(b))) return 'blog';
  return 'unknown';
}

/**
 * Get flags for known domains
 */
function getFlagsForDomain(domain: string): SourceFlag[] {
  const flags: SourceFlag[] = [];

  // Peer-reviewed sources
  if (['nature.com', 'science.org', 'sciencedirect.com', 'pubmed', 'jstor.org'].some(d => domain.includes(d))) {
    flags.push('peer_reviewed');
  }

  // Primary sources (government, official)
  if (['gov', 'who.int', 'un.org', 'europa.eu'].some(d => domain.includes(d))) {
    flags.push('primary_source');
  }

  // User-generated content
  if (['reddit.com', 'quora.com', 'medium.com', 'substack.com', 'wikipedia.org'].some(d => domain.includes(d))) {
    flags.push('user_generated');
  }

  // Paywalled sources
  if (['nytimes.com', 'wsj.com', 'ft.com', 'economist.com', 'bloomberg.com'].some(d => domain.includes(d))) {
    flags.push('paywalled');
  }

  return flags;
}

/**
 * Calculate default score for unknown domains
 */
function calculateDefaultScore(hostname: string, pathname: string): SourceAuthority {
  let score = 50; // Base score
  const flags: SourceFlag[] = [];

  // Positive signals
  if (hostname.includes('university') || hostname.includes('research') || hostname.includes('institute')) {
    score += 15;
  }
  if (hostname.includes('official') || hostname.includes('foundation')) {
    score += 10;
  }
  if (pathname.includes('/research') || pathname.includes('/studies') || pathname.includes('/publications')) {
    score += 5;
  }

  // Negative signals
  if (hostname.includes('blog') || hostname.includes('news') && !hostname.includes('reuters') && !hostname.includes('ap')) {
    score -= 10;
    flags.push('opinion');
  }
  if (hostname.includes('shop') || hostname.includes('store') || hostname.includes('buy')) {
    score -= 15;
    flags.push('sponsored');
  }
  if (pathname.includes('/affiliate') || pathname.includes('/sponsored')) {
    score -= 20;
    flags.push('sponsored');
  }

  // Clamp score
  score = Math.max(20, Math.min(75, score));

  return {
    score,
    tier: score >= 70 ? 'medium' : score >= 50 ? 'medium' : 'low',
    category: 'unknown',
    flags,
  };
}

/**
 * Format authority for display
 */
export function formatAuthority(authority: SourceAuthority): string {
  const tierLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    unknown: 'Unknown'
  };

  return `${tierLabels[authority.tier]} (${authority.score})`;
}

/**
 * Get authority badge color class
 */
export function getAuthorityColor(authority: SourceAuthority): string {
  switch (authority.tier) {
    case 'high':
      return 'bg-sage-100 text-sage-700';
    case 'medium':
      return 'bg-grey-100 text-grey-600';
    case 'low':
      return 'bg-grey-100 text-grey-500';
    default:
      return 'bg-grey-50 text-grey-400';
  }
}

/**
 * Sort search results by authority score
 */
export function sortByAuthority<T extends { url: string }>(results: T[]): T[] {
  return [...results].sort((a, b) => {
    const authorityA = getSourceAuthority(a.url);
    const authorityB = getSourceAuthority(b.url);
    return authorityB.score - authorityA.score;
  });
}

/**
 * Filter results to only high-quality sources
 */
export function filterHighQuality<T extends { url: string }>(results: T[], minScore: number = 60): T[] {
  return results.filter(r => getSourceAuthority(r.url).score >= minScore);
}
