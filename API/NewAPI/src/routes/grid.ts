import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GeoValidator, KRISTIANSAND_BOUNDS } from '../utils/geo';
import { RateLimiter } from '../utils/rateLimiter';
import { ClimateProvider } from '../providers/climateProvider';
import { PollutionProvider } from '../providers/pollutionProvider';
import { ElevationProvider } from '../providers/elevationProvider';
import { EnergyProvider } from '../providers/energyProvider';
import { GridPoint } from '../types';

const querySchema = z.object({
    minLat: z.coerce.number(),
    maxLat: z.coerce.number(),
    minLon: z.coerce.number(),
    maxLon: z.coerce.number(),
    points: z.coerce.number().default(25),
    layers: z.string().optional() // not fully impl filtering here, returning all for MVP convenience
});

// Specific rate limiter for grid: 1 request / 2 minutes
const gridRateLimiter = new RateLimiter(1, 2 * 60 * 1000);

export async function getGrid(request: FastifyRequest, reply: FastifyReply) {
    const ip = (request.headers['x-forwarded-for'] as string) || request.ip;

    if (!gridRateLimiter.check(ip)) {
        return reply.code(429).send({ error: 'Grid rate limit exceeded (1 req / 2 min)' });
    }

    const parseResult = querySchema.safeParse(request.query);
    if (!parseResult.success) {
        return reply.code(400).send({ error: 'Invalid parameters' });
    }

    const { minLat, maxLat, minLon, maxLon, points } = parseResult.data;

    // Bounds check of the requested box against valid area
    // We check if the requested box overlaps/is contained in Krs area. 
    // Stricter: Validate corners.
    try {
        GeoValidator.validateOrThrow(minLat, minLon);
        GeoValidator.validateOrThrow(maxLat, maxLon);
    } catch (e: any) {
        return reply.code(400).send({ error: `Grid bounds outside allowed area: ${e.message}` });
    }

    const pointCount = Math.min(Math.max(points, 1), 40); // clamp 1..40
    const rows = Math.floor(Math.sqrt(pointCount));
    const cols = Math.ceil(pointCount / rows);

    const latStep = (maxLat - minLat) / (rows > 1 ? rows - 1 : 1);
    const lonStep = (maxLon - minLon) / (cols > 1 ? cols - 1 : 1);

    const gridPoints: Promise<GridPoint>[] = [];
    let idCounter = 0;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (idCounter >= pointCount) break;

            const pLat = minLat + (r * latStep);
            const pLon = minLon + (c * lonStep);
            const id = `p-${idCounter++}`;

            gridPoints.push((async () => {
                const [clim, poll, elev, ener] = await Promise.all([
                    ClimateProvider.getClimate(pLat, pLon),
                    PollutionProvider.getPollution(pLat, pLon),
                    ElevationProvider.getElevation(pLat, pLon),
                    EnergyProvider.getEnergy(pLat, pLon)
                ]);

                return {
                    id,
                    lat: pLat,
                    lon: pLon,
                    klima: clim || undefined,
                    forurensing: poll || undefined,
                    hoyde: elev || undefined,
                    energi: ener || undefined
                };
            })());
        }
    }

    const result = await Promise.all(gridPoints);
    return result;
}
