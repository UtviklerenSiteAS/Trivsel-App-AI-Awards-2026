import { CacheEntry } from '../types';

export class InMemoryCache {
    private cache: Map<string, CacheEntry<any>> = new Map();

    set<T>(key: string, data: T, ttlSeconds: number): void {
        const now = Date.now();
        const entry: CacheEntry<T> = {
            data,
            timestamp: now,
            expiry: now + (ttlSeconds * 1000),
        };
        this.cache.set(key, entry);
    }

    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}

export const globalCache = new InMemoryCache();
