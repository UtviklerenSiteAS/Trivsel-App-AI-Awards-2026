import { fetchWithRetry } from '../utils/httpClient';
import { globalCache } from '../utils/cache';
import { PollutionData } from '../types';
import { logger } from '../utils/logger';

// MET Airquality URL
const POLLUTION_API_URL = 'https://api.met.no/weatherapi/airqualityforecast/0.1/';
const CACHE_TTL_SECONDS = 60 * 60; // 60 minutes

export class PollutionProvider {

    static async getPollution(lat: number, lon: number): Promise<PollutionData | null> {
        const rLat = lat.toFixed(3);
        const rLon = lon.toFixed(3);
        const cacheKey = `pollution:${rLat}:${rLon}`;

        const cached = globalCache.get<PollutionData>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // Trying real API first
            const url = `${POLLUTION_API_URL}?lat=${rLat}&lon=${rLon}`;
            logger.info(`Fetching pollution data from ${url}`);

            const response = await fetchWithRetry(url);
            const data = await response.json() as any;

            // Simple parsing logic for MET airquality (structure varies, taking first time step)
            const current = data.data.time[0].variables;

            const result: PollutionData = {
                airQualityIndex: undefined, // MET doesn't provide a single AQI number directly in this endpoint usually
                pm10: current.pm10_concentration?.value,
                pm2_5: current.pm25_concentration?.value,
                o3: current.o3_concentration?.value,
                no2: current.no2_concentration?.value,
                timestamp: new Date().toISOString(),
                source: 'met',
                confidence: 'high'
            };

            // Calculate a simple mock AQI if not present based on PM2.5
            if (result.pm2_5 !== undefined) {
                if (result.pm2_5 < 10) result.airQualityIndex = 1; // Good
                else if (result.pm2_5 < 20) result.airQualityIndex = 2; // Fair
                else result.airQualityIndex = 3; // Poor
            }

            globalCache.set(cacheKey, result, CACHE_TTL_SECONDS);
            return result;

        } catch (error: any) {
            logger.warn(`Failed to fetch pollution data, falling back to mock: ${error.message}`);

            // Fallback Mock
            const mockResult: PollutionData = {
                airQualityIndex: 1,
                pm10: 15.5,
                pm2_5: 8.2,
                o3: 40.1,
                no2: 12.3,
                timestamp: new Date().toISOString(),
                source: 'mock',
                confidence: 'low (mock)'
            };

            return mockResult;
        }
    }
}
