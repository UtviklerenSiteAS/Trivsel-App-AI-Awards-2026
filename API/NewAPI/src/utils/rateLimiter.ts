export class RateLimiter {
    private windows: Map<string, { startTime: number; count: number }> = new Map();
    private readonly defaultLimit: number;
    private readonly defaultWindowMs: number;

    constructor(defaultLimit: number, defaultWindowMs: number) {
        this.defaultLimit = defaultLimit;
        this.defaultWindowMs = defaultWindowMs;
    }

    /**
     * Check if a key (IP) is within limits.
     * Returns true if allowed, false if limited.
     */
    check(key: string, limit?: number, windowMs?: number): boolean {
        const effectiveLimit = limit ?? this.defaultLimit;
        const effectiveWindow = windowMs ?? this.defaultWindowMs;
        const now = Date.now();

        const record = this.windows.get(key);

        if (!record) {
            this.windows.set(key, { startTime: now, count: 1 });
            return true;
        }

        if (now - record.startTime > effectiveWindow) {
            // New window
            this.windows.set(key, { startTime: now, count: 1 });
            return true;
        }

        if (record.count < effectiveLimit) {
            record.count++;
            return true;
        }

        return false;
    }

    /**
     * Get remaining requests for a key (approximate).
     */
    getRemaining(key: string, limit: number): number {
        const record = this.windows.get(key);
        if (!record) return limit;
        return Math.max(0, limit - record.count);
    }
}

// Global rate limiter instance: 60 requests per 10 minutes (600000ms)
export const globalRateLimiter = new RateLimiter(60, 10 * 60 * 1000);
