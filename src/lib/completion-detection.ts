/**
 * Quality-Based Completion Detection
 * Determines when research is sufficiently complete based on quality criteria
 */

export interface CompletionCriteria {
  minSources: number;
  minHighAuthoritySources: number;
  minValidatedClaims: number;
  minFindingsLength: number;
  minQualityScore: number; // Average of quality metrics (1-5)
  requiresValidation: boolean;
}

export interface ResearchProgress {
  sourcesCount: number;
  highAuthoritySources: number;
  validatedClaimsCount: number;
  findingsLength: number;
  qualityMetrics?: {
    sourceDiversity: number;
    factVerification: number;
    completeness: number;
    actionability: number;
  };
  hasWrittenFindings: boolean;
  hasSelfEvaluated: boolean;
  lastSelfEvaluationRecommendation?: string;
}

export interface CompletionStatus {
  isComplete: boolean;
  completionScore: number; // 0-100
  missingCriteria: string[];
  recommendations: string[];
  canForceComplete: boolean;
}

/**
 * Parse step content to derive dynamic completion criteria
 */
export function deriveCompletionCriteria(stepContent: string): CompletionCriteria {
  const content = stepContent.toLowerCase();

  // Start with base criteria
  const criteria: CompletionCriteria = {
    minSources: 3,
    minHighAuthoritySources: 1,
    minValidatedClaims: 0,
    minFindingsLength: 500,
    minQualityScore: 3,
    requiresValidation: false,
  };

  // Adjust based on step content

  // Comprehensive/thorough tasks need more sources
  if (content.includes('comprehensive') || content.includes('thorough') || content.includes('detailed')) {
    criteria.minSources = 5;
    criteria.minHighAuthoritySources = 2;
    criteria.minFindingsLength = 800;
    criteria.minQualityScore = 3.5;
  }

  // Verification tasks need validated claims
  if (content.includes('verify') || content.includes('validate') || content.includes('fact-check') || content.includes('confirm')) {
    criteria.minValidatedClaims = 2;
    criteria.requiresValidation = true;
    criteria.minQualityScore = 3.5;
  }

  // Comparison tasks need multiple sources
  if (content.includes('compare') || content.includes('contrast') || content.includes('vs')) {
    criteria.minSources = 4;
    criteria.minHighAuthoritySources = 2;
  }

  // Brief/quick tasks can have lower requirements
  if (content.includes('brief') || content.includes('quick') || content.includes('summary')) {
    criteria.minSources = 2;
    criteria.minHighAuthoritySources = 1;
    criteria.minFindingsLength = 300;
    criteria.minQualityScore = 2.5;
  }

  // Research/investigate tasks need more depth
  if (content.includes('research') || content.includes('investigate') || content.includes('analyze')) {
    criteria.minSources = Math.max(criteria.minSources, 4);
    criteria.minFindingsLength = Math.max(criteria.minFindingsLength, 600);
  }

  // Important/critical tasks need higher quality
  if (content.includes('important') || content.includes('critical') || content.includes('essential')) {
    criteria.minHighAuthoritySources = Math.max(criteria.minHighAuthoritySources, 2);
    criteria.minQualityScore = Math.max(criteria.minQualityScore, 4);
    criteria.requiresValidation = true;
    criteria.minValidatedClaims = Math.max(criteria.minValidatedClaims, 1);
  }

  return criteria;
}

/**
 * Calculate current quality score from metrics
 */
export function calculateQualityScore(metrics?: {
  sourceDiversity: number;
  factVerification: number;
  completeness: number;
  actionability: number;
}): number {
  if (!metrics) return 3; // Default to average

  const values = [
    metrics.sourceDiversity,
    metrics.factVerification,
    metrics.completeness,
    metrics.actionability,
  ].filter(v => typeof v === 'number' && v > 0);

  if (values.length === 0) return 3;

  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Check if research meets completion criteria
 */
export function checkCompletion(
  progress: ResearchProgress,
  criteria: CompletionCriteria
): CompletionStatus {
  const missingCriteria: string[] = [];
  const recommendations: string[] = [];
  let totalCriteria = 0;
  let metCriteria = 0;

  // Check sources
  totalCriteria++;
  if (progress.sourcesCount >= criteria.minSources) {
    metCriteria++;
  } else {
    missingCriteria.push(`Need ${criteria.minSources - progress.sourcesCount} more sources (have ${progress.sourcesCount}/${criteria.minSources})`);
    recommendations.push('Use web_search or deep_search to find more sources');
  }

  // Check high authority sources
  totalCriteria++;
  if (progress.highAuthoritySources >= criteria.minHighAuthoritySources) {
    metCriteria++;
  } else {
    missingCriteria.push(`Need ${criteria.minHighAuthoritySources - progress.highAuthoritySources} more high-authority sources (have ${progress.highAuthoritySources}/${criteria.minHighAuthoritySources})`);
    recommendations.push('Focus on .gov, .edu, or major news sites with browse_website');
  }

  // Check validated claims (if required)
  if (criteria.requiresValidation || criteria.minValidatedClaims > 0) {
    totalCriteria++;
    if (progress.validatedClaimsCount >= criteria.minValidatedClaims) {
      metCriteria++;
    } else {
      missingCriteria.push(`Need ${criteria.minValidatedClaims - progress.validatedClaimsCount} more validated claims (have ${progress.validatedClaimsCount}/${criteria.minValidatedClaims})`);
      recommendations.push('Use validate_information on key facts and statistics');
    }
  }

  // Check findings length
  totalCriteria++;
  if (progress.findingsLength >= criteria.minFindingsLength) {
    metCriteria++;
  } else {
    missingCriteria.push(`Findings too short (${progress.findingsLength}/${criteria.minFindingsLength} chars)`);
    recommendations.push('Use write_findings to document more of your research');
  }

  // Check quality score
  const qualityScore = calculateQualityScore(progress.qualityMetrics);
  totalCriteria++;
  if (qualityScore >= criteria.minQualityScore) {
    metCriteria++;
  } else {
    missingCriteria.push(`Quality score too low (${qualityScore.toFixed(1)}/${criteria.minQualityScore})`);
    if (qualityScore < 3) {
      recommendations.push('Use self_evaluate to identify gaps, then address them');
    }
  }

  // Check basic requirements
  if (!progress.hasWrittenFindings) {
    missingCriteria.push('No findings written yet');
    recommendations.push('Document your research with write_findings');
  }

  // Calculate completion score
  const completionScore = Math.round((metCriteria / totalCriteria) * 100);

  // Determine if can force complete (met most criteria)
  const canForceComplete = completionScore >= 60 && progress.hasWrittenFindings;

  // Determine overall completion
  const isComplete = missingCriteria.length === 0 && progress.hasWrittenFindings;

  return {
    isComplete,
    completionScore,
    missingCriteria,
    recommendations,
    canForceComplete,
  };
}

/**
 * Generate completion feedback for the agent
 */
export function generateCompletionFeedback(status: CompletionStatus, isLastIteration: boolean): string {
  if (status.isComplete) {
    return 'Research meets all quality criteria. You may complete this step.';
  }

  let feedback = `Completion: ${status.completionScore}%\n\n`;

  if (status.missingCriteria.length > 0) {
    feedback += '**Missing:**\n';
    feedback += status.missingCriteria.map(c => `- ${c}`).join('\n');
    feedback += '\n\n';
  }

  if (status.recommendations.length > 0) {
    feedback += '**Recommendations:**\n';
    feedback += status.recommendations.map(r => `- ${r}`).join('\n');
    feedback += '\n';
  }

  if (isLastIteration) {
    if (status.canForceComplete) {
      feedback += '\n**Note:** This is the final iteration. Complete with write_findings using what you have.';
    } else {
      feedback += '\n**Warning:** Final iteration reached. Document whatever findings you have with write_findings.';
    }
  }

  return feedback;
}

/**
 * Should the agent continue or complete?
 */
export function shouldContinue(
  progress: ResearchProgress,
  criteria: CompletionCriteria,
  iteration: number,
  maxIterations: number
): { shouldContinue: boolean; reason: string } {
  const status = checkCompletion(progress, criteria);

  // Complete if all criteria met
  if (status.isComplete) {
    return {
      shouldContinue: false,
      reason: 'All quality criteria met. Research is complete.',
    };
  }

  // Self-evaluation said complete
  if (progress.lastSelfEvaluationRecommendation === 'complete' && progress.hasWrittenFindings) {
    return {
      shouldContinue: false,
      reason: 'Self-evaluation indicates research is complete.',
    };
  }

  // Force complete on last iteration
  if (iteration >= maxIterations - 1) {
    return {
      shouldContinue: false,
      reason: 'Maximum iterations reached. Must finalize.',
    };
  }

  // Continue if missing critical criteria and have iterations left
  if (status.completionScore < 50 && iteration < maxIterations - 2) {
    return {
      shouldContinue: true,
      reason: `Completion only ${status.completionScore}%. Continue improving: ${status.recommendations[0] || 'gather more information'}`,
    };
  }

  // Can force complete if close enough
  if (status.canForceComplete && iteration >= maxIterations - 3) {
    return {
      shouldContinue: false,
      reason: 'Sufficient progress made. Consider completing.',
    };
  }

  return {
    shouldContinue: true,
    reason: `Continue to meet criteria: ${status.missingCriteria[0] || 'improve quality'}`,
  };
}

/**
 * Get quality-based iteration limit adjustment
 */
export function adjustIterationLimit(
  baseLimit: number,
  stepContent: string,
  progress?: ResearchProgress
): number {
  let adjusted = baseLimit;

  const criteria = deriveCompletionCriteria(stepContent);

  // If criteria are stricter, may need more iterations
  if (criteria.minSources >= 5 || criteria.minQualityScore >= 4) {
    adjusted += 2;
  }

  // If already making good progress, can reduce
  if (progress) {
    const status = checkCompletion(progress, criteria);
    if (status.completionScore >= 80) {
      adjusted -= 1;
    }
  }

  // Cap at reasonable bounds
  return Math.max(4, Math.min(adjusted, 15));
}

/**
 * Estimate remaining iterations needed
 */
export function estimateRemainingIterations(
  progress: ResearchProgress,
  criteria: CompletionCriteria
): number {
  const status = checkCompletion(progress, criteria);

  if (status.isComplete) return 0;

  // Rough estimate: 1-2 iterations per missing criterion
  const missingCount = status.missingCriteria.length;

  // If no findings yet, need at least 2 iterations (search + write)
  if (!progress.hasWrittenFindings) {
    return Math.max(2, missingCount);
  }

  // If have findings but missing validation, need 1-2 more
  if (progress.validatedClaimsCount === 0 && criteria.requiresValidation) {
    return Math.max(2, missingCount);
  }

  return Math.max(1, Math.ceil(missingCount * 0.75));
}
