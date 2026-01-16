export const MAPBOX_CONFIG = {
  accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '',
  styles: {
    light: 'mapbox://styles/mapbox/light-v11',
    streets: 'mapbox://styles/mapbox/streets-v12',
    satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  },
  geocoding: {
    endpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
    country: 'us', // Restrict to US only
  },
} as const;

// Validate token is configured (client-side only)
if (typeof window !== 'undefined' && !MAPBOX_CONFIG.accessToken) {
  throw new Error('NEXT_PUBLIC_MAPBOX_TOKEN is not set. Map features will not work. Please add it to .env.local');
}
