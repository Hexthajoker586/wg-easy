// ! Auto Imports are not supported in this file

/**
 * Simple in-memory rate limiter for authentication attempts
 * Tracks failed login attempts and implements temporary lockout
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly MAX_ATTEMPTS = 5; // Max failed attempts
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
  private readonly LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout
  private readonly CLEANUP_INTERVAL = 60 * 1000; // Cleanup every minute

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Check if an identifier (IP or username) is rate limited
   * @returns true if rate limited (locked out)
   */
  isRateLimited(identifier: string): boolean {
    const entry = this.attempts.get(identifier);

    if (!entry) {
      return false;
    }

    const now = Date.now();

    // Check if currently locked out
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return true;
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      this.attempts.delete(identifier);
      return false;
    }

    return false;
  }

  /**
   * Record a failed authentication attempt
   * @returns true if now rate limited after this attempt
   */
  recordFailedAttempt(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      // First failed attempt
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      return false;
    }

    // Check if window has expired
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      // Reset the window
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
      });
      return false;
    }

    // Increment count
    entry.count++;

    // Check if we've exceeded max attempts
    if (entry.count >= this.MAX_ATTEMPTS) {
      entry.lockedUntil = now + this.LOCKOUT_MS;
      return true;
    }

    return false;
  }

  /**
   * Reset attempts for an identifier (called on successful login)
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const entry = this.attempts.get(identifier);

    if (!entry) {
      return this.MAX_ATTEMPTS;
    }

    const now = Date.now();

    // If window expired, return max
    if (now - entry.firstAttempt > this.WINDOW_MS) {
      return this.MAX_ATTEMPTS;
    }

    return Math.max(0, this.MAX_ATTEMPTS - entry.count);
  }

  /**
   * Get time until unlock (in milliseconds)
   */
  getTimeUntilUnlock(identifier: string): number {
    const entry = this.attempts.get(identifier);

    if (!entry || !entry.lockedUntil) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, entry.lockedUntil - now);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [identifier, entry] of this.attempts.entries()) {
      // Remove if window expired and not locked
      if (
        now - entry.firstAttempt > this.WINDOW_MS &&
        (!entry.lockedUntil || now > entry.lockedUntil)
      ) {
        toDelete.push(identifier);
      }
    }

    for (const identifier of toDelete) {
      this.attempts.delete(identifier);
    }
  }

  /**
   * Stop the cleanup interval (for cleanup/testing)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance - use global to persist across hot reloads in development
declare global {
  var __rateLimiter: RateLimiter | undefined;
}

const rateLimiter = globalThis.__rateLimiter || new RateLimiter();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__rateLimiter = rateLimiter;
}

export default rateLimiter;
