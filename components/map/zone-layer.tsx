'use client';

import { Source, Layer } from 'react-map-gl/mapbox';
import { getZoneGeoJSON } from '@/lib/mapbox/zones';
import type { LayerProps } from 'react-map-gl/mapbox';

interface ZoneLayerProps {
  visible: boolean;
}

export function ZoneLayer({ visible }: ZoneLayerProps) {
  if (!visible) return null;

  const zoneGeoJSON = getZoneGeoJSON();

  const fillLayer: LayerProps = {
    id: 'zone-fill',
    type: 'fill',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.1,
    },
  };

  const lineLayer: LayerProps = {
    id: 'zone-line',
    type: 'line',
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 2,
    },
  };

  const labelLayer: LayerProps = {
    id: 'zone-label',
    type: 'symbol',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 14,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
    },
  };

  return (
    <Source id="zones" type="geojson" data={zoneGeoJSON}>
      <Layer {...fillLayer} />
      <Layer {...lineLayer} />
      <Layer {...labelLayer} />
    </Source>
  );
}
