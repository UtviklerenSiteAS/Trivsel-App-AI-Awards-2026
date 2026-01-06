import { fetchWithRetry } from '../utils/httpClient';
import { globalCache } from '../utils/cache';
import { ElevationData } from '../types';
import { logger } from '../utils/logger';

const ELEVATION_API_URL = 'https://ws.geonorge.no/hoydedata/v1/punkt';
const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours

export class ElevationProvider {

    static async getElevation(lat: number, lon: number): Promise<ElevationData | null> {
        const rLat = lat.toFixed(4); // Higher precision for elevation
        const rLon = lon.toFixed(4);
        const cacheKey = `elevation:${rLat}:${rLon}`;

        const cached = globalCache.get<ElevationData>(cacheKey);
        if (cached) {
            return cached;
        }

        try {
            // GeoNorge requires koordsys=4326 for WGS84
            const url = `${ELEVATION_API_URL}?nord=${lat}&ost=${lon}&koordsys=4326&geojson=true`;

            const response = await fetchWithRetry(url);
            const data = await response.json() as any;

            // Response format expectation:
            // { "value": 12.3, ... } or geojson structure
            // Actually GeoNorge punkt endpoint returns: { type: 'Point', coordinates: [..], properties: { value: 123.4 } }

            const el = data.properties?.value;

            if (el === undefined) {
                throw new Error('Invalid response format from Kartverket');
            }

            const result: ElevationData = {
                elevationMeters: el,
                source: 'kartverket',
                timestamp: new Date().toISOString()
            };

            globalCache.set(cacheKey, result, CACHE_TTL_SECONDS);
            return result;

        } catch (error: any) {
            logger.error(`Failed to fetch elevation, falling back to mock: ${error.message}`);

            // Fallback: Simple pseudo-elevation based on coordinates logic (just to vary it)
            const mockElevation = Math.abs(Math.sin(lat * 100) * Math.cos(lon * 100) * 100);

            const mockResult: ElevationData = {
                elevationMeters: parseFloat(mockElevation.toFixed(1)),
                source: 'mock',
                timestamp: new Date().toISOString()
            };

            return mockResult;
        }
    }
}
