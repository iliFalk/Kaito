/**
 * Rate Limiter utility for API calls
 * Prevents excessive API requests and helps avoid rate limit errors
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: string;
}

interface RequestRecord {
  timestamp: number;
  count: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private requests: Map<string, number[]> = new Map();
  private requestCounts: Map<string, RequestRecord> = new Map();
  
  private constructor() {}
  
  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }
  
  /**
   * Check if a request can be made based on rate limits
   * @param key - Unique identifier for the rate limit bucket
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if request is allowed, false otherwise
   */
  canMakeRequest(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the time window
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request timestamp
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }
  
  /**
   * Get the remaining number of requests allowed
   */
  getRemainingRequests(key: string, maxRequests: number, windowMs: number): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
  
  /**
   * Get the time until the rate limit resets (in milliseconds)
   */
  getResetTime(key: string, windowMs: number): number {
    const requests = this.requests.get(key) || [];
    
    if (requests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...requests);
    const resetTime = oldestRequest + windowMs;
    const now = Date.now();
    
    return Math.max(0, resetTime - now);
  }
  
  /**
   * Clear rate limit data for a specific key
   */
  clearLimit(key: string): void {
    this.requests.delete(key);
    this.requestCounts.delete(key);
  }
  
  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
    this.requestCounts.clear();
  }
  
  /**
   * Advanced rate limiting with exponential backoff
   */
  async withRateLimit<T>(
    key: string,
    config: RateLimitConfig,
    fn: () => Promise<T>,
    options?: {
      retries?: number;
      backoffMultiplier?: number;
      onRateLimitHit?: (remainingMs: number) => void;
    }
  ): Promise<T> {
    const { maxRequests, windowMs } = config;
    const { retries = 3, backoffMultiplier = 2, onRateLimitHit } = options || {};
    
    let attempt = 0;
    let backoffMs = 1000; // Start with 1 second
    
    while (attempt < retries) {
      if (this.canMakeRequest(key, maxRequests, windowMs)) {
        try {
          return await fn();
        } catch (error) {
          // If it's a rate limit error, handle it
          if (this.isRateLimitError(error)) {
            attempt++;
            const resetTime = this.getResetTime(key, windowMs);
            
            if (onRateLimitHit) {
              onRateLimitHit(resetTime);
            }
            
            if (attempt < retries) {
              // Wait with exponential backoff
              await this.sleep(Math.min(resetTime, backoffMs));
              backoffMs *= backoffMultiplier;
              continue;
            }
          }
          throw error;
        }
      } else {
        // Rate limit hit before making request
        const resetTime = this.getResetTime(key, windowMs);
        
        if (onRateLimitHit) {
          onRateLimitHit(resetTime);
        }
        
        if (attempt < retries) {
          await this.sleep(Math.min(resetTime, backoffMs));
          backoffMs *= backoffMultiplier;
          attempt++;
          continue;
        } else {
          throw new RateLimitError(`Rate limit exceeded for ${key}. Try again in ${Math.ceil(resetTime / 1000)} seconds.`);
        }
      }
    }
    
    throw new RateLimitError(`Rate limit exceeded for ${key} after ${retries} retries.`);
  }
  
  /**
   * Check if an error is a rate limit error
   */
  private isRateLimitError(error: any): boolean {
    if (error instanceof RateLimitError) {
      return true;
    }
    
    // Check for common rate limit error patterns
    const message = error?.message?.toLowerCase() || '';
    const status = error?.response?.status || error?.status;
    
    return (
      status === 429 ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('quota exceeded')
    );
  }
  
  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get rate limit statistics
   */
  getStats(key: string): {
    requestCount: number;
    oldestRequest: Date | null;
    newestRequest: Date | null;
  } {
    const requests = this.requests.get(key) || [];
    
    if (requests.length === 0) {
      return {
        requestCount: 0,
        oldestRequest: null,
        newestRequest: null
      };
    }
    
    return {
      requestCount: requests.length,
      oldestRequest: new Date(Math.min(...requests)),
      newestRequest: new Date(Math.max(...requests))
    };
  }
}

/**
 * Custom Rate Limit Error
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Create a rate-limited function wrapper
 */
export function createRateLimitedFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RateLimitConfig
): T {
  const rateLimiter = RateLimiter.getInstance();
  const key = config.identifier || fn.name || 'anonymous';
  
  return (async (...args: Parameters<T>) => {
    return rateLimiter.withRateLimit(
      key,
      config,
      () => fn(...args)
    );
  }) as T;
}

/**
 * Decorator for rate limiting class methods
 */
export function RateLimit(config: RateLimitConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const rateLimiter = RateLimiter.getInstance();
    const key = config.identifier || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      return rateLimiter.withRateLimit(
        key,
        config,
        () => originalMethod.apply(this, args)
      );
    };
    
    return descriptor;
  };
}

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance();

/**
 * Usage Examples:
 * 
 * // Basic usage
 * import { rateLimiter } from './utils/rateLimiter';
 * 
 * // Check if request can be made
 * if (rateLimiter.canMakeRequest('gemini-api', 10, 60000)) {
 *   // Make API call
 * }
 * 
 * // With automatic retry and backoff
 * const result = await rateLimiter.withRateLimit(
 *   'gemini-api',
 *   { maxRequests: 10, windowMs: 60000 },
 *   async () => {
 *     return await callGeminiAPI(prompt);
 *   },
 *   {
 *     retries: 3,
 *     onRateLimitHit: (ms) => console.log(`Rate limit hit, waiting ${ms}ms`)
 *   }
 * );
 * 
 * // Create a rate-limited function
 * const rateLimitedAPI = createRateLimitedFunction(
 *   callGeminiAPI,
 *   { maxRequests: 10, windowMs: 60000, identifier: 'gemini' }
 * );
 * 
 * // Using decorator on class methods
 * class APIService {
 *   @RateLimit({ maxRequests: 10, windowMs: 60000 })
 *   async callAPI(prompt: string) {
 *     // API call implementation
 *   }
 * }
 */