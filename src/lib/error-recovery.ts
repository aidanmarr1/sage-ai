/**
 * Error Recovery System
 * Provides retry logic, graceful degradation, and error classification
 */

export type ErrorType = 'network' | 'timeout' | 'rate_limit' | 'parse' | 'not_found' | 'auth' | 'unknown';

export interface ErrorInfo {
  type: ErrorType;
  message: string;
  retryable: boolean;
  suggestedFallback?: string;
  waitTime?: number; // ms to wait before retry
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
}

// Default retry configurations per tool
export const RETRY_CONFIGS: Record<string, RetryConfig> = {
  web_search: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  browse_website: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 8000,
    backoffMultiplier: 2,
  },
  validate_information: {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 1.5,
  },
  deep_search: {
    maxRetries: 2,
    baseDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
};

// Fallback chains when a tool fails
export const FALLBACK_CHAINS: Record<string, string[]> = {
  browse_website: ['web_search'], // If browse fails, suggest search
  deep_search: ['web_search'], // If deep search fails, suggest regular search
  validate_information: ['web_search'], // If validation fails, suggest search
};

/**
 * Classify an error to determine appropriate handling
 */
export function classifyError(error: unknown): ErrorInfo {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection') || message.includes('econnrefused')) {
      return {
        type: 'network',
        message: 'Network connection failed',
        retryable: true,
        waitTime: 2000,
      };
    }

    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out') || message.includes('aborted')) {
      return {
        type: 'timeout',
        message: 'Request timed out',
        retryable: true,
        waitTime: 3000,
      };
    }

    // Rate limit errors
    if (message.includes('429') || message.includes('rate limit') || message.includes('too many requests')) {
      return {
        type: 'rate_limit',
        message: 'Rate limit exceeded',
        retryable: true,
        waitTime: 5000,
      };
    }

    // Parse errors
    if (message.includes('parse') || message.includes('json') || message.includes('syntax')) {
      return {
        type: 'parse',
        message: 'Failed to parse response',
        retryable: false,
      };
    }

    // Not found errors
    if (message.includes('404') || message.includes('not found')) {
      return {
        type: 'not_found',
        message: 'Resource not found',
        retryable: false,
      };
    }

    // Auth errors
    if (message.includes('401') || message.includes('403') || message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        type: 'auth',
        message: 'Authentication or permission error',
        retryable: false,
      };
    }
  }

  return {
    type: 'unknown',
    message: error instanceof Error ? error.message : 'Unknown error occurred',
    retryable: true,
    waitTime: 1000,
  };
}

/**
 * Calculate delay for exponential backoff
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 500;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  toolName: string,
  onRetry?: (attempt: number, error: ErrorInfo) => void
): Promise<{ success: true; data: T } | { success: false; error: ErrorInfo; attempts: number }> {
  const config = RETRY_CONFIGS[toolName] || {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  };

  let lastError: ErrorInfo | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const data = await fn();
      return { success: true, data };
    } catch (error) {
      const errorInfo = classifyError(error);
      lastError = errorInfo;

      // Don't retry non-retryable errors
      if (!errorInfo.retryable) {
        return { success: false, error: errorInfo, attempts: attempt + 1 };
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= config.maxRetries) {
        return { success: false, error: errorInfo, attempts: attempt + 1 };
      }

      // Calculate and wait for backoff delay
      const delay = calculateBackoffDelay(attempt, config);
      onRetry?.(attempt + 1, errorInfo);
      await sleep(delay);
    }
  }

  return {
    success: false,
    error: lastError || { type: 'unknown', message: 'Max retries exceeded', retryable: false },
    attempts: config.maxRetries + 1,
  };
}

/**
 * Get fallback suggestions for a failed tool
 */
export function getFallbackSuggestion(toolName: string, errorInfo: ErrorInfo): string | null {
  const fallbacks = FALLBACK_CHAINS[toolName];
  if (!fallbacks || fallbacks.length === 0) {
    return null;
  }

  // Customize message based on error type
  const fallbackTool = fallbacks[0];

  switch (toolName) {
    case 'browse_website':
      return `Browse failed (${errorInfo.message}). Try using web_search to find alternative sources or cached content.`;
    case 'deep_search':
      return `Deep search failed (${errorInfo.message}). Use web_search with a more specific query instead.`;
    case 'validate_information':
      return `Validation search failed (${errorInfo.message}). Try using web_search to find corroborating sources manually.`;
    default:
      return `${toolName} failed (${errorInfo.message}). Consider using ${fallbackTool} as an alternative.`;
  }
}

/**
 * Generate agent feedback message for an error
 */
export function generateErrorFeedback(
  toolName: string,
  errorInfo: ErrorInfo,
  attempts: number
): string {
  let feedback = `Tool "${toolName}" failed after ${attempts} attempt${attempts > 1 ? 's' : ''}.\n`;
  feedback += `Error type: ${errorInfo.type}\n`;
  feedback += `Details: ${errorInfo.message}\n\n`;

  const fallbackSuggestion = getFallbackSuggestion(toolName, errorInfo);
  if (fallbackSuggestion) {
    feedback += `Suggestion: ${fallbackSuggestion}\n`;
  }

  if (errorInfo.retryable && attempts < (RETRY_CONFIGS[toolName]?.maxRetries || 2)) {
    feedback += `You may retry this operation, but consider the suggestion above first.`;
  } else {
    feedback += `Consider an alternative approach to complete this task.`;
  }

  return feedback;
}

/**
 * Track error patterns for adaptive behavior
 */
export class ErrorTracker {
  private errors: Map<string, { count: number; lastError: Date; types: ErrorType[] }> = new Map();
  private readonly windowMs: number;

  constructor(windowMs: number = 60000) { // 1 minute window
    this.windowMs = windowMs;
  }

  recordError(toolName: string, errorType: ErrorType): void {
    const now = new Date();
    const existing = this.errors.get(toolName);

    if (existing && now.getTime() - existing.lastError.getTime() < this.windowMs) {
      existing.count++;
      existing.lastError = now;
      if (!existing.types.includes(errorType)) {
        existing.types.push(errorType);
      }
    } else {
      this.errors.set(toolName, {
        count: 1,
        lastError: now,
        types: [errorType],
      });
    }
  }

  shouldAvoidTool(toolName: string): boolean {
    const errors = this.errors.get(toolName);
    if (!errors) return false;

    const now = new Date();
    // Avoid tool if it had 3+ errors in the window
    if (now.getTime() - errors.lastError.getTime() < this.windowMs && errors.count >= 3) {
      return true;
    }

    return false;
  }

  getToolStatus(toolName: string): 'healthy' | 'degraded' | 'failing' {
    const errors = this.errors.get(toolName);
    if (!errors) return 'healthy';

    const now = new Date();
    if (now.getTime() - errors.lastError.getTime() > this.windowMs) {
      return 'healthy';
    }

    if (errors.count >= 3) return 'failing';
    if (errors.count >= 2) return 'degraded';
    return 'healthy';
  }

  reset(): void {
    this.errors.clear();
  }
}
