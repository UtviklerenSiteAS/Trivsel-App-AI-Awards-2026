import { apiScheduler } from './scheduler';
import { API_CONFIG } from '../utils/constants';

// --- Types ---
export interface EnvironmentalData {
    temperature?: number;
    airQuality: number; // 0-100 (0 = Good)
    traffic: number;    // 0-100 (0 = Low)
    lifeQuality: number; // 0-100 (100 = Good)
    timestamp: number;
}

// --- Configuration ---
const MET_API_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const CACHE_KEY_PREFIX = 'trivsel_v1_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * TrivselService
 * 
 * A unified service to fetch environmental data for the Kristiansand region.
 * Handles:
 * - Rate Limiting (via Scheduler)
 * - Caching (localStorage)
 * - Data Aggregation (Met API + Mocks)
 * - Derived Metrics (Life Quality)
 */
export class TrivselService {
    private static instance: TrivselService;

    private constructor() { }

    public static getInstance(): TrivselService {
        if (!TrivselService.instance) {
            TrivselService.instance = new TrivselService();
        }
        return TrivselService.instance;
    }

    /**
     * Fetches all environmental data for a specific coordinate.
     * Returns cached data if valid, otherwise fetches fresh data.
     */
    public async getData(lat: number, lon: number): Promise<EnvironmentalData> {
        const cacheKey = `${CACHE_KEY_PREFIX}${lat.toFixed(3)}_${lon.toFixed(3)}`;

        // 1. Check Cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        // 2. Fetch Fresh Data (Rate Limited)
        // We group fetching into a single scheduled task per point to be efficient
        const data = await apiScheduler.schedule(async () => {
            const [temp, traffic, air] = await Promise.all([
                this.fetchTemperature(lat, lon),
                this.fetchTraffic(lat, lon),
                this.fetchAirQuality(lat, lon)
            ]);

            const lifeQuality = this.calculateLifeQuality(temp, air, traffic);

            return {
                temperature: temp ?? undefined,
                airQuality: air,
                traffic: traffic,
                lifeQuality: lifeQuality,
                timestamp: Date.now()
            };
        }, cacheKey, 1000); // Enforce 1s spacing between SAME key requests (though unique keys mostly)

        // 3. Save to Cache
        this.saveToCache(cacheKey, data);
        return data;
    }

    // --- Private Implementation Helpers ---

    private getFromCache(key: string): EnvironmentalData | null {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;
            const parsed = JSON.parse(item) as EnvironmentalData;
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
                return parsed;
            }
            return null;
        } catch {
            return null;
        }
    }

    private saveToCache(key: string, data: EnvironmentalData) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.warn('Cache quota exceeded');
        }
    }

    private async fetchTemperature(lat: number, lon: number): Promise<number | null> {
        try {
            const response = await fetch(`${MET_API_BASE}?lat=${lat}&lon=${lon}`, {
                headers: { 'User-Agent': API_CONFIG.userAgent }
            });
            if (!response.ok) return null;
            const json = await response.json();
            return json.properties.timeseries[0].data.instant.details.air_temperature;
        } catch {
            return null;
        }
    }

    private async fetchTraffic(lat: number, lon: number): Promise<number> {
        // Mock Logic
        const hour = new Date().getHours();
        let baseLoad = 20;
        if ((hour >= 7 && hour <= 9) || (hour >= 15 && hour <= 17)) baseLoad += 50;
        const noise = (Math.sin(lat * 1000) + Math.cos(lon * 1000)) * 10;
        return Math.max(0, Math.min(100, baseLoad + noise));
    }

    private async fetchAirQuality(lat: number, lon: number): Promise<number> {
        // Mock Logic based on Traffic
        const traffic = await this.fetchTraffic(lat, lon);
        const noise = Math.random() * 20 - 10;
        return Math.max(0, Math.min(100, traffic * 0.6 + noise));
    }

    private calculateLifeQuality(temp: number | null, air: number, traffic: number): number {
        const safeTemp = temp ?? 10; // Default buffer
        const tempDiff = Math.abs(safeTemp - 18);
        const tempComfort = Math.max(0, 100 - tempDiff * 10);

        const airGoodness = 100 - air;
        const trafficGoodness = 100 - traffic;

        return 0.6 * airGoodness + 0.3 * trafficGoodness + 0.1 * tempComfort;
    }
}

export const trivselService = TrivselService.getInstance();
