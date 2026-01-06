import { FastifyRequest, FastifyReply } from 'fastify';

export async function getSources(request: FastifyRequest, reply: FastifyReply) {
    return {
        sources: [
            {
                name: 'MET Norway',
                type: 'Climate',
                description: 'Temperature, Wind, Precipitation from Locationforecast 2.0',
                attribution: 'Data from MET Norway, licensed under CC BY 4.0'
            },
            {
                name: 'Kartverket / GeoNorge',
                type: 'Elevation',
                description: 'Elevation data for coordinates',
                attribution: '© Kartverket via GeoNorge'
            },
            {
                name: 'MET AirQuality',
                type: 'Pollution',
                description: 'Air quality forecast',
                attribution: 'Data from MET Norway'
            },
            {
                name: 'Mock Energy Provider',
                type: 'Energy',
                description: 'Simulated energy grid context for MVP'
            }
        ]
    };
}
