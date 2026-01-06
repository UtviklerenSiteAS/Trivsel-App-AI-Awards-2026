import { fetchWithRetry } from '../utils/httpClient';
import { globalCache } from '../utils/cache';
import { ClimateData } from '../types';
import { logger } from '../utils/logger';

const MET_API_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const CACHE_TTL_SECONDS = 30 * 60; // 30 minutes

export class ClimateProvider {

    static async getClimate(lat: number, lon: number): Promise<ClimateData | null> {
        // Round to 3 decimals to improve cache hit rate
        const rLat = lat.toFixed(3);
        const rLon = lon.toFixed(3);
        const cacheKey = `climate:${rLat}:${rLon}`;

        const cached = globalCache.get<ClimateData>(cacheKey);
        if (cached) {
            logger.debug(`Cache HIT for climate ${cacheKey}`);
            return cached;
        }

        try {
            const url = `${MET_API_URL}?lat=${rLat}&lon=${rLon}`;
            logger.info(`Fetching climate data from ${url}`);

            const response = await fetchWithRetry(url);
            const data = await response.json() as any;

            const current = data.properties.timeseries[0].data.instant.details;
            const next1h = data.properties.timeseries[0].data.next_1_hours?.details;

            const result: ClimateData = {
                temperatureC: current.air_temperature,
                windSpeedMps: current.wind_speed,
                precipitationMm: next1h?.precipitation_amount ?? 0,
                timestamp: new Date().toISOString(),
                source: 'met'
            };

            globalCache.set(cacheKey, result, CACHE_TTL_SECONDS);
            return result;

        } catch (error: any) {
            logger.error(`Failed to fetch climate data: ${error.message}`);
            return null;
        }
    }
}
