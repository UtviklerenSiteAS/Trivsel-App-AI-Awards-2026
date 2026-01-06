import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GeoValidator } from '../utils/geo';
import { ClimateProvider } from '../providers/climateProvider';
import { PollutionProvider } from '../providers/pollutionProvider';
import { ElevationProvider } from '../providers/elevationProvider';
import { EnergyProvider } from '../providers/energyProvider';

const querySchema = z.object({
    lat: z.string().transform(Number),
    lon: z.string().transform(Number),
});

export async function getSummary(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = querySchema.safeParse(request.query);

    if (!parseResult.success) {
        return reply.code(400).send({ error: 'Invalid coordinates' });
    }

    const { lat, lon } = parseResult.data;

    try {
        GeoValidator.validateOrThrow(lat, lon);
    } catch (e: any) {
        return reply.code(400).send({ error: e.message });
    }

    // Parallel fetch
    const [climate, pollution, elevation, energy] = await Promise.all([
        ClimateProvider.getClimate(lat, lon),
        PollutionProvider.getPollution(lat, lon),
        ElevationProvider.getElevation(lat, lon),
        EnergyProvider.getEnergy(lat, lon)
    ]);

    return {
        location: {
            lat,
            lon,
            withinBounds: true
        },
        klima: climate,
        forurensing: pollution,
        hoyde: elevation,
        energi: energy,
        meta: {
            sourcesUsed: ['met', 'kartverket', 'mock'],
            generatedAt: new Date().toISOString()
        }
    };
}
