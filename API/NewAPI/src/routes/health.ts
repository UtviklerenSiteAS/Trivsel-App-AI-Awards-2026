import { FastifyRequest, FastifyReply } from 'fastify';

export async function checkHealth(request: FastifyRequest, reply: FastifyReply) {
    return {
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    };
}
