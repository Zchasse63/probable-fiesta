import { MAPBOX_CONFIG } from './config';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  confidence: number;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPBOX_CONFIG.accessToken || MAPBOX_CONFIG.accessToken === 'pk.placeholder') {
    throw new Error('Valid Mapbox access token is not configured');
  }

  const encodedAddress = encodeURIComponent(address);

  // Mapbox Geocoding API requires access_token as URL query parameter, not Authorization header
  const url = `${MAPBOX_CONFIG.geocoding.endpoint}/${encodedAddress}.json?access_token=${MAPBOX_CONFIG.accessToken}&country=${MAPBOX_CONFIG.geocoding.country}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Mapbox authentication failed - invalid or missing access token');
      }
      if (response.status === 429) {
        throw new Error('Mapbox rate limit exceeded - too many geocoding requests');
      }
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No results found for address');
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    // Confidence based on relevance score (0-1 scale)
    const confidence = feature.relevance || 0;

    return {
      latitude,
      longitude,
      confidence,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
    throw new Error('Unknown geocoding error');
  }
}
