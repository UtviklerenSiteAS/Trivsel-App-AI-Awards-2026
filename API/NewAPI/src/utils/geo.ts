import { Coordinates, Bounds } from '../types';

// Hard-coded strict bounds for Kristiansand
export const KRISTIANSAND_BOUNDS: Bounds = {
    minLat: 58.05,
    maxLat: 58.25,
    minLon: 7.85,
    maxLon: 8.25
};

export class GeoValidator {

    static isInBounds(coords: Coordinates): boolean {
        return (
            coords.lat >= KRISTIANSAND_BOUNDS.minLat &&
            coords.lat <= KRISTIANSAND_BOUNDS.maxLat &&
            coords.lon >= KRISTIANSAND_BOUNDS.minLon &&
            coords.lon <= KRISTIANSAND_BOUNDS.maxLon
        );
    }

    static validateOrThrow(lat: number, lon: number): void {
        if (isNaN(lat) || isNaN(lon)) {
            throw new Error('Invalid coordinates: NaN');
        }

        if (!this.isInBounds({ lat, lon })) {
            throw new Error(`Coordinates out of bounds (${KRISTIANSAND_BOUNDS.minLat}-${KRISTIANSAND_BOUNDS.maxLat}, ${KRISTIANSAND_BOUNDS.minLon}-${KRISTIANSAND_BOUNDS.maxLon})`);
        }
    }
}
