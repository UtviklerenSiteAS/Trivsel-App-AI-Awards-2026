import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GeoValidator } from '../utils/geo';
import { ElevationProvider } from '../providers/elevationProvider';

const querySchema = z.object({
    lat: z.string().transform(Number),
    lon: z.string().transform(Number),
});

export async function getElevation(request: FastifyRequest, reply: FastifyReply) {
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

    const data = await ElevationProvider.getElevation(lat, lon);

    if (!data) {
        return reply.code(503).send({ error: 'Elevation data unavailable', availability: false });
    }

    return data;
}
