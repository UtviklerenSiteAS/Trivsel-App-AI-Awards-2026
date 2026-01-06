import { EnergyData } from '../types';

export class EnergyProvider {

    static async getEnergy(lat: number, lon: number): Promise<EnergyData> {
        // Completely mocked for MVP as per requirements
        // Simulating some "local" variation based on lat/lon

        // Deterministic pseudo-random based on coords to make it look stable for same location
        const seed = (lat + lon) * 1000;
        const loadStart = 40 + (seed % 40); // 40-80%
        const renewableStart = 50 + (seed % 50); // 50-100%

        return {
            energyContext: {
                gridLoadEstimate: `${loadStart.toFixed(0)}%`,
                renewableShare: `${renewableStart.toFixed(0)}%`,
                localIndustryIndicator: (seed % 2 > 1) ? 'High' : 'Low'
            },
            source: 'mock',
            timestamp: new Date().toISOString(),
            note: 'Mock provider in MVP'
        };
    }
}
