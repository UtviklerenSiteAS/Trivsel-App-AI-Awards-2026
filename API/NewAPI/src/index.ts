import fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config';
import { logger } from './utils/logger';
import { globalRateLimiter } from './utils/rateLimiter';

// Import Routes
import { checkHealth } from './routes/health';
import { getSources } from './routes/sources';
import { getClimate } from './routes/climate';
import { getPollution } from './routes/pollution';
import { getElevation } from './routes/elevation';
import { getEnergy } from './routes/energy';
import { getSummary } from './routes/summary';
import { getGrid } from './routes/grid';

const server = fastify({
    logger: {
        level: env.LOG_LEVEL,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        },
    },
    disableRequestLogging: true // We will add custom logging loop
});

// Middleware: Global Rate Limit & Logging
server.addHook('onRequest', async (request, reply) => {
    const ip = (request.headers['x-forwarded-for'] as string) || request.ip;
    const url = request.raw.url;

    // Simple IP rate limit check
    if (!globalRateLimiter.check(ip)) {
        reply.code(429).send({ error: 'Too Many Requests' });
        return;
    }

    logger.info({ msg: 'Incoming request', method: request.method, url, ip });
});

server.register(cors, {
    origin: '*', // Allow all for MVP/School project usage
    methods: ['GET']
});

// Swagger
server.register(swagger, {
    openapi: {
        info: {
            title: 'Trivsel Data API',
            description: 'API for environmental data in Kristiansand area',
            version: '1.0.0'
        },
        servers: [{ url: `http://localhost:${env.PORT}` }]
    }
});
server.register(swaggerUi, {
    routePrefix: '/docs',
});

// Routes
server.get('/health', checkHealth);
server.get('/sources', getSources);

server.get('/v1/klima', getClimate);
server.get('/v1/forurensing', getPollution);
server.get('/v1/hoyde', getElevation);
server.get('/v1/energi', getEnergy);
server.get('/v1/sammendrag', getSummary);
server.get('/v1/grid', getGrid);

export { server };

if (require.main === module) {
    const start = async () => {
        try {
            await server.ready();
            await server.listen({ port: env.PORT, host: '0.0.0.0' });
            console.log(`Server listening at http://localhost:${env.PORT}`);
            console.log(`Docs available at http://localhost:${env.PORT}/docs`);
        } catch (err) {
            server.log.error(err);
            process.exit(1);
        }
    };
    start();
}
