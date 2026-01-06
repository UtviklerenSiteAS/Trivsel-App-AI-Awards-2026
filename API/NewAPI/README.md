# Trivsel Data API

A robust, read-only API serving environmental data (Climate, Pollution, Elevation, Energy) for the **Kristiansand** region.
Designed as a Backend-for-Frontend (BFF) for the Trivsel app.

## Features
- **Strict Geographic Scope**: Restricted to Kristiansand (58.05-58.25N, 7.85-8.25E).
- **Data Providers**:
  - Climate: MET Norway Locationforecast 2.0
  - Pollution: MET Norway AirQuality (or Mock fallback)
  - Elevation: Kartverket / GeoNorge (or Mock fallback)
  - Energy: Mock provider (MVP)
- **Robustness**:
  - In-memory caching with variable TTL.
  - Rate limiting (Global & Grid-specific).
  - Retry mechanism for external calls.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### Documentation
OpenAPI (Swagger) documentation is available at:
`http://localhost:3000/docs`

## Configuration
Environment variables can be set in `.env`:
- `PORT`: Server port (default 3000)
- `MET_USER_AGENT`: User-Agent for MET API calls (Required)
- `LOG_LEVEL`: pino log level (default 'info')

## Endpoints

### Core
- `GET /health`: API status.
- `GET /sources`: List of data sources and attribution.

### Data
- `GET /v1/klima?lat=..&lon=..`: Temperature, wind, precipitation.
- `GET /v1/forurensing?lat=..&lon=..`: Air quality data.
- `GET /v1/hoyde?lat=..&lon=..`: Elevation in meters.
- `GET /v1/energi?lat=..&lon=..`: Energy context.

### Composite
- `GET /v1/sammendrag?lat=..&lon=..`: All data for a single point.
- `GET /v1/grid?minLat=..&maxLat=..&minLon=..&maxLon=..&points=25`: Batch data for a grid.

## Data Sources & Attribution
- **MET Norway**: Weather and Air Quality data. Licensed under CC BY 4.0.
- **Kartverket/GeoNorge**: Elevation data.
- **Mock**: Used for Energy data in MVP.

## Rate Limits
- General: 60 requests / 10 min per IP.
- Grid: 1 request / 2 min per IP.

## Security
No personal data is processed or stored. This API is a read-only proxy.

## Delivery & Deployment

### Option 1: Docker (Recommended)
This approach ensures the API runs exactly the same on any machine.
1. Build the image:
```bash
docker build -t trivsel-api .
```
2. Run the container:
```bash
docker run -p 3000:3000 -e MET_USER_AGENT="YourSchoolContact" trivsel-api
```

### Option 2: Source Code (Zip)
1. Zip the following files/folders:
   - `src/`
   - `package.json`
   - `tsconfig.json`
   - `README.md`
2. **Do not** include `node_modules`.
3. The recipient must run:
   ```bash
   npm install
   npm run build
   npm start
   ```
