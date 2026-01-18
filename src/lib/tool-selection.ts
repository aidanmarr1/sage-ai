/**
 * Smart Tool Selection System
 * Provides context-aware tool selection based on research phase, progress, and patterns
 */

export type ResearchPhase = 'discovery' | 'investigation' | 'validation' | 'synthesis';

export interface ToolUsagePattern {
  tool: string;
  timestamp: Date;
}

export interface ResearchContext {
  // Current progress
  iteration: number;
  maxIterations: number;
  hasFindings: boolean;
  findingsLength: number;

  // Tool history
  toolHistory: ToolUsagePattern[];

  // Research metrics
  sourcesCount: number;
  highAuthoritySources: number;
  validatedClaimsCount: number;
  searchesPerformed: number;
  pagesVisited: number;

  // Step content
  stepContent: string;

  // Quality scores (if available)
  qualityMetrics?: {
    sourceDiversity?: number;
    factVerification?: number;
    completeness?: number;
  };
}

export interface ToolSuggestion {
  type: 'required' | 'suggested' | 'blocked' | 'auto';
  tool?: string;
  reason: string;
  alternatives?: string[];
}

/**
 * Detect the current research phase based on context
 */
export function detectPhase(context: ResearchContext): ResearchPhase {
  const { iteration, maxIterations, hasFindings, sourcesCount, validatedClaimsCount, searchesPerformed } = context;

  const progressPercent = iteration / maxIterations;

  // Early iterations: discovery phase
  if (progressPercent < 0.25 || searchesPerformed === 0) {
    return 'discovery';
  }

  // Mid iterations with some sources: investigation
  if (progressPercent < 0.6 && sourcesCount < 3) {
    return 'investigation';
  }

  // Have sources but need validation
  if (sourcesCount >= 2 && validatedClaimsCount === 0 && progressPercent < 0.75) {
    return 'validation';
  }

  // Late iterations or have findings: synthesis
  if (progressPercent >= 0.6 || hasFindings) {
    return 'synthesis';
  }

  return 'investigation';
}

/**
 * Detect if the agent is stuck in a tool loop
 */
export function detectToolLoop(history: ToolUsagePattern[], windowSize: number = 6): {
  isLooping: boolean;
  loopPattern?: string[];
  suggestion: string;
} {
  if (history.length < windowSize) {
    return { isLooping: false, suggestion: '' };
  }

  const recentTools = history.slice(-windowSize).map(t => t.tool);
  const uniqueTools = new Set(recentTools);

  // Only 1-2 unique tools in the last 6 calls indicates a loop
  if (uniqueTools.size <= 2 && recentTools.length >= windowSize) {
    const loopPattern = Array.from(uniqueTools);

    // Determine suggestion based on the loop pattern
    if (loopPattern.includes('web_search') && loopPattern.includes('reason')) {
      return {
        isLooping: true,
        loopPattern,
        suggestion: 'You are alternating between search and reasoning without progress. Try browsing a high-authority source or writing your current findings.',
      };
    }

    if (loopPattern.includes('browse_website')) {
      return {
        isLooping: true,
        loopPattern,
        suggestion: 'You have browsed multiple pages without writing findings. Document what you have learned with write_findings.',
      };
    }

    return {
      isLooping: true,
      loopPattern,
      suggestion: `You seem stuck using only: ${loopPattern.join(', ')}. Try a different approach or document your findings.`,
    };
  }

  return { isLooping: false, suggestion: '' };
}

/**
 * Count recent uses of a specific tool
 */
export function countRecentToolUses(history: ToolUsagePattern[], toolName: string, windowSize: number = 10): number {
  return history.slice(-windowSize).filter(t => t.tool === toolName).length;
}

/**
 * Check if a tool is overused
 */
export function isToolOverused(history: ToolUsagePattern[], toolName: string, threshold: number = 3): boolean {
  return countRecentToolUses(history, toolName, 10) >= threshold;
}

/**
 * Get tools that should be blocked due to overuse
 */
export function getBlockedTools(history: ToolUsagePattern[]): string[] {
  const blocked: string[] = [];
  const toolCounts = new Map<string, number>();

  // Count tools in last 10 calls
  for (const entry of history.slice(-10)) {
    toolCounts.set(entry.tool, (toolCounts.get(entry.tool) || 0) + 1);
  }

  for (const [tool, count] of toolCounts) {
    // Block tools used 4+ times in last 10 calls (except write_findings and reason)
    if (count >= 4 && !['write_findings', 'reason', 'self_evaluate'].includes(tool)) {
      blocked.push(tool);
    }
  }

  return blocked;
}

/**
 * Get phase-appropriate tools
 */
export function getPhaseTools(phase: ResearchPhase): { preferred: string[]; avoid: string[] } {
  switch (phase) {
    case 'discovery':
      return {
        preferred: ['reason', 'web_search', 'deep_search'],
        avoid: ['write_findings'], // Too early to write
      };

    case 'investigation':
      return {
        preferred: ['browse_website', 'web_search', 'validate_information'],
        avoid: [], // Most tools appropriate
      };

    case 'validation':
      return {
        preferred: ['validate_information', 'browse_website', 'web_search'],
        avoid: ['deep_search'], // Already have sources
      };

    case 'synthesis':
      return {
        preferred: ['write_findings', 'self_evaluate', 'analyze_and_extract'],
        avoid: ['deep_search'], // Should be writing, not searching more
      };
  }
}

/**
 * Parse step content to extract hints about required approach
 */
export function parseStepHints(stepContent: string): {
  needsComprehensive: boolean;
  needsValidation: boolean;
  needsComparison: boolean;
  isBrief: boolean;
  keywords: string[];
} {
  const content = stepContent.toLowerCase();

  return {
    needsComprehensive: content.includes('comprehensive') || content.includes('thorough') || content.includes('detailed'),
    needsValidation: content.includes('verify') || content.includes('validate') || content.includes('fact-check') || content.includes('confirm'),
    needsComparison: content.includes('compare') || content.includes('contrast') || content.includes('vs') || content.includes('versus'),
    isBrief: content.includes('brief') || content.includes('quick') || content.includes('summary'),
    keywords: extractKeywords(content),
  };
}

/**
 * Extract important keywords from step content
 */
function extractKeywords(content: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'it', 'its']);

  return content
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 10);
}

/**
 * Main tool selection function
 */
export function selectTool(context: ResearchContext): ToolSuggestion {
  const { iteration, maxIterations, hasFindings, findingsLength, toolHistory, sourcesCount, highAuthoritySources, validatedClaimsCount, stepContent, qualityMetrics } = context;

  // First iteration: always require reasoning
  if (iteration === 1) {
    return {
      type: 'required',
      tool: 'reason',
      reason: 'Start with structured reasoning to plan your approach.',
    };
  }

  // Detect research phase
  const phase = detectPhase(context);
  const phaseTools = getPhaseTools(phase);
  const stepHints = parseStepHints(stepContent);

  // Check for tool loops
  const loopInfo = detectToolLoop(toolHistory);
  if (loopInfo.isLooping) {
    // Force a different tool
    if (!hasFindings && findingsLength === 0) {
      return {
        type: 'required',
        tool: 'write_findings',
        reason: `${loopInfo.suggestion} Document what you know so far.`,
      };
    }

    if (validatedClaimsCount === 0 && sourcesCount >= 2) {
      return {
        type: 'suggested',
        tool: 'validate_information',
        reason: loopInfo.suggestion,
        alternatives: ['self_evaluate', 'write_findings'],
      };
    }

    return {
      type: 'suggested',
      tool: 'self_evaluate',
      reason: loopInfo.suggestion,
      alternatives: ['write_findings', 'track_progress'],
    };
  }

  // Get blocked tools
  const blockedTools = getBlockedTools(toolHistory);

  // Near end without findings: force write
  if (iteration >= maxIterations - 2 && !hasFindings) {
    return {
      type: 'required',
      tool: 'write_findings',
      reason: 'Running low on iterations. Document your findings now.',
    };
  }

  // Last iteration: must finalize
  if (iteration === maxIterations - 1) {
    if (!hasFindings) {
      return {
        type: 'required',
        tool: 'write_findings',
        reason: 'Final iteration. You must document your findings.',
      };
    }
    return {
      type: 'suggested',
      tool: 'self_evaluate',
      reason: 'Final iteration. Evaluate your work quality.',
      alternatives: ['write_findings'],
    };
  }

  // Quality-based suggestions
  if (qualityMetrics) {
    const avgQuality = (
      (qualityMetrics.sourceDiversity || 3) +
      (qualityMetrics.factVerification || 3) +
      (qualityMetrics.completeness || 3)
    ) / 3;

    // Low source diversity
    if ((qualityMetrics.sourceDiversity || 3) < 3 && sourcesCount < 3) {
      return {
        type: 'suggested',
        tool: 'web_search',
        reason: 'Source diversity is low. Search for additional perspectives.',
        alternatives: ['deep_search'],
      };
    }

    // Low fact verification
    if ((qualityMetrics.factVerification || 3) < 3 && validatedClaimsCount === 0) {
      return {
        type: 'suggested',
        tool: 'validate_information',
        reason: 'Fact verification is low. Validate key claims.',
        alternatives: ['browse_website'],
      };
    }

    // Good quality, ready to finish
    if (avgQuality >= 4 && hasFindings) {
      return {
        type: 'suggested',
        tool: 'self_evaluate',
        reason: 'Quality metrics look good. Consider finalizing.',
        alternatives: ['write_findings'],
      };
    }
  }

  // Step-specific suggestions
  if (stepHints.needsValidation && validatedClaimsCount === 0 && sourcesCount > 0) {
    return {
      type: 'suggested',
      tool: 'validate_information',
      reason: 'Step requires validation. Verify key facts.',
      alternatives: ['web_search'],
    };
  }

  if (stepHints.needsComprehensive && sourcesCount < 4) {
    return {
      type: 'suggested',
      tool: 'deep_search',
      reason: 'Comprehensive coverage needed. Search multiple aspects.',
      alternatives: ['web_search'],
    };
  }

  // Phase-based suggestions
  if (phase === 'discovery' && sourcesCount === 0) {
    return {
      type: 'suggested',
      tool: 'web_search',
      reason: 'Discovery phase: start gathering sources.',
      alternatives: phaseTools.preferred.filter(t => t !== 'web_search'),
    };
  }

  if (phase === 'investigation' && sourcesCount > 0 && highAuthoritySources === 0) {
    return {
      type: 'suggested',
      tool: 'browse_website',
      reason: 'Have sources but need detailed content. Browse high-authority results.',
      alternatives: ['validate_information'],
    };
  }

  if (phase === 'synthesis' && !hasFindings) {
    return {
      type: 'suggested',
      tool: 'write_findings',
      reason: 'Synthesis phase: document your research.',
      alternatives: ['analyze_and_extract'],
    };
  }

  // Default: let the model choose
  return {
    type: 'auto',
    reason: 'Context allows flexible tool choice.',
    alternatives: phaseTools.preferred.filter(t => !blockedTools.includes(t)),
  };
}

/**
 * Convert tool suggestion to API tool_choice format
 */
export function toApiToolChoice(
  suggestion: ToolSuggestion
): 'auto' | 'required' | { type: 'function'; function: { name: string } } {
  if (suggestion.type === 'auto') {
    return 'auto';
  }

  if (suggestion.type === 'required' && suggestion.tool) {
    return { type: 'function', function: { name: suggestion.tool } };
  }

  if (suggestion.type === 'suggested') {
    // For suggestions, we still use auto but could add hints to prompt
    return 'auto';
  }

  if (suggestion.type === 'blocked') {
    // Can't directly block in API, would need prompt engineering
    return 'auto';
  }

  return 'auto';
}

/**
 * Generate guidance text for the agent based on suggestion
 */
export function generateToolGuidance(suggestion: ToolSuggestion): string {
  if (suggestion.type === 'auto') {
    return '';
  }

  let guidance = `**Tool Guidance:** ${suggestion.reason}`;

  if (suggestion.tool) {
    guidance += ` Consider using: ${suggestion.tool}`;
  }

  if (suggestion.alternatives && suggestion.alternatives.length > 0) {
    guidance += ` Alternatives: ${suggestion.alternatives.join(', ')}`;
  }

  return guidance;
}
