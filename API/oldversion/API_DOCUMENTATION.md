# TrivselService API Documentation

The `TrivselService` is a unified, singleton-based data service that handles fetching, caching, and aggregating environmental data for the Trivsel application.

## Key Features
- **Centralized Data Fetching**: Aggregates Temperature (MET API), Traffic (Mock), and Air Quality (Mock).
- **Rate Limiting**: Uses a strict scheduler to prevent API abuse (max 1 request per second/point).
- **Caching**: Automatically caches results in `localStorage` for 30 minutes.
- **Derived Metrics**: Calculates "Life Quality" score automatically.

## Usage

### 1. Import the Service
```typescript
import { trivselService } from './services/TrivselService';
```

### 2. Fetch Data for a Coordinate
The main method is `getData(lat, lon)`. It returns a promise that resolves to an `EnvironmentalData` object.

```typescript
// Example: Fetch data for Kristiansand Center
const lat = 58.1467;
const lon = 7.9956;

trivselService.getData(lat, lon).then(data => {
  console.log("Temperature:", data.temperature);
  console.log("Life Quality Index:", data.lifeQuality);
});
```

### 3. Data Structure
The returned object has the following shape:
```typescript
interface EnvironmentalData {
  temperature?: number; // degrees Celsius
  airQuality: number;   // 0-100 (Lower is better for raw value, but LifeQuality inverts this)
  traffic: number;      // 0-100 (Lower is better)
  lifeQuality: number;  // 0-100 (Higher is "Good")
  timestamp: number;    // Cache timestamp
}
```

## Adding New Data Sources
To add a new data source (e.g., Noise Level):
1. Add the field to `EnvironmentalData` interface.
2. Implement a `private async fetchNoise(lat, lon)` method.
3. Call it inside `getData` inside the `Promise.all`.
4. Update `calculateLifeQuality` to include the new metric.
