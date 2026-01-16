import type { FeatureCollection, Polygon } from 'geojson';

// State boundary approximations (simplified polygons for visualization)
// In production, these would be more detailed GeoJSON files
const ZONE_DEFINITIONS: Record<string, {
  name: string;
  color: string;
  states: string[];
  bounds: number[][];
}> = {
  '1': {
    name: 'Southeast',
    color: '#FF6B6B',
    states: ['FL', 'GA', 'AL', 'SC', 'NC', 'TN', 'MS'],
    // Approximate bounds for Southeast zone
    bounds: [
      [-92, 24], [-75, 24], [-75, 37], [-82, 37], [-92, 36], [-92, 24]
    ],
  },
  '2': {
    name: 'Northeast',
    color: '#4ECDC4',
    states: ['NY', 'NJ', 'PA', 'MA', 'CT', 'MD', 'VA', 'DE'],
    // Approximate bounds for Northeast zone
    bounds: [
      [-80, 36], [-70, 36], [-70, 45], [-80, 45], [-80, 36]
    ],
  },
  '3': {
    name: 'Midwest',
    color: '#45B7D1',
    states: ['OH', 'MI', 'IL', 'IN', 'WI', 'MN', 'MO'],
    // Approximate bounds for Midwest zone
    bounds: [
      [-95, 37], [-82, 37], [-82, 49], [-95, 49], [-95, 37]
    ],
  },
  '4': {
    name: 'West/Other',
    color: '#FFA07A',
    states: ['TX', 'CA', 'AZ', 'NV', 'OR', 'WA', 'CO', 'UT'],
    // Approximate bounds for West/Other zone
    bounds: [
      [-125, 25], [-95, 25], [-95, 49], [-125, 49], [-125, 25]
    ],
  },
};

export function getZoneGeoJSON(): FeatureCollection<Polygon> {
  const features = Object.entries(ZONE_DEFINITIONS).map(([zoneId, zone]) => ({
    type: 'Feature' as const,
    properties: {
      zoneId,
      name: zone.name,
      color: zone.color,
      states: zone.states,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [zone.bounds],
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

// Helper to get zone color by ID
export function getZoneColor(zoneId: string): string {
  return ZONE_DEFINITIONS[zoneId]?.color || '#999999';
}

// Helper to get zone name by ID
export function getZoneName(zoneId: string): string {
  return ZONE_DEFINITIONS[zoneId]?.name || 'Unknown';
}

// Helper to assign zone by state
export function getZoneByState(state: string): string | null {
  const stateUpper = state.toUpperCase();

  for (const [zoneId, zone] of Object.entries(ZONE_DEFINITIONS)) {
    if (zone.states.includes(stateUpper)) {
      return zoneId;
    }
  }

  return null; // State not in any zone
}
