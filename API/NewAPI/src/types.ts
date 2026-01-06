export interface Coordinates {
    lat: number;
    lon: number;
}

export interface Bounds {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: number; // Date.now()
    expiry: number; // timestamp + ttl
}

export interface ApiError {
    error: string;
    statusCode: number;
    details?: unknown;
}

export interface EnvConfig {
    PORT: number;
    NODE_ENV: 'development' | 'production' | 'test';
    MET_USER_AGENT: string;
}

// Data models
export interface ClimateData {
    temperatureC: number;
    windSpeedMps: number;
    precipitationMm?: number;
    timestamp: string;
    source: string;
}

export interface PollutionData {
    airQualityIndex?: number;
    pm10?: number;
    pm2_5?: number;
    o3?: number;
    no2?: number;
    timestamp: string;
    source: string;
    confidence: string;
}

export interface ElevationData {
    elevationMeters: number;
    source: string;
    timestamp: string;
}

export interface EnergyData {
    energyContext: {
        gridLoadEstimate?: string;
        renewableShare?: string;
        localIndustryIndicator?: string;
    };
    source: string;
    timestamp: string;
    note?: string;
}

export interface GridPoint {
    id: string;
    lat: number;
    lon: number;
    klima?: ClimateData;
    forurensing?: PollutionData;
    hoyde?: ElevationData;
    energi?: EnergyData;
}
