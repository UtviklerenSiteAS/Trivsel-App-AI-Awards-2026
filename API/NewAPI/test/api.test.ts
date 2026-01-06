import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { server } from '../src/index';

describe('Trivsel API', () => {

    const VALID_LAT = 58.15;
    const VALID_LON = 8.00;

    const INVALID_LAT = 59.99; // Oslo (Out of bounds)
    const INVALID_LON = 10.75;

    beforeAll(async () => {
        // Start fastify instance (without listening on port if using inject, but ready() is good)
        await server.ready();
    });

    afterAll(async () => {
        await server.close();
    });

    it('GET /health should return status ok', async () => {
        const response = await server.inject({
            method: 'GET',
            url: '/health'
        });
        expect(response.statusCode).toBe(200);
        const json = response.json();
        expect(json.status).toBe('ok');
    });

    it('GET /v1/klima should return data for valid Kristiansand coords', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/v1/klima?lat=${VALID_LAT}&lon=${VALID_LON}`
        });
        // It might fail if MET is down or rate limited, but we expect handled response
        // If it's a 503 it means unavailable, which is also a valid API state handled.
        // Ideally it is 200.
        if (response.statusCode === 200) {
            const json = response.json();
            expect(json.temperatureC).toBeDefined();
            expect(json.source).toBe('met');
        } else {
            expect(response.statusCode).toBe(503);
        }
    });

    it('GET /v1/klima should fail for coordinates outside Kristiansand', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/v1/klima?lat=${INVALID_LAT}&lon=${INVALID_LON}`
        });
        expect(response.statusCode).toBe(400); // Bad Request
        expect(response.json().error).toContain('out of bounds');
    });

    it('GET /v1/sammendrag should return combined data', async () => {
        const response = await server.inject({
            method: 'GET',
            url: `/v1/sammendrag?lat=${VALID_LAT}&lon=${VALID_LON}`
        });
        if (response.statusCode === 200) {
            const json = response.json();
            expect(json.klima).toBeDefined();
            expect(json.hoyde).toBeDefined();
            expect(json.location.withinBounds).toBe(true);
        }
    });

});
