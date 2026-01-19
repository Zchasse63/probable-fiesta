'use client';

import { Marker } from 'react-map-gl/mapbox';

interface ClusterMarkerProps {
  cluster: {
    id: number;
    latitude: number;
    longitude: number;
    point_count: number;
  };
  onClick: () => void;
}

export function ClusterMarker({ cluster, onClick }: ClusterMarkerProps) {
  const size = 20 + Math.min(cluster.point_count / 10, 20); // Scale 20-40px

  return (
    <Marker
      latitude={cluster.latitude}
      longitude={cluster.longitude}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold cursor-pointer shadow-lg hover:bg-primary transition-colors border-2 border-white"
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, size / 3),
        }}
      >
        {cluster.point_count}
      </div>
    </Marker>
  );
}
