import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { GeoValidator } from '../utils/geo';
import { EnergyProvider } from '../providers/energyProvider';

const querySchema = z.object({
    lat: z.string().transform(Number),
    lon: z.string().transform(Number),
});

export async function getEnergy(request: FastifyRequest, reply: FastifyReply) {
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

    const data = await EnergyProvider.getEnergy(lat, lon);
    return data;
}
