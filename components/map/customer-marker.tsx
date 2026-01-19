'use client';

import { Marker } from 'react-map-gl/mapbox';
import { getZoneColor } from '@/lib/mapbox/zones';

interface CustomerMarkerProps {
  customer: {
    id: string;
    company_name: string;
    lat: number;
    lng: number;
    zone_id: number | null;
  };
  isSelected: boolean;
  onClick: () => void;
}

export function CustomerMarker({ customer, isSelected, onClick }: CustomerMarkerProps) {
  const color = customer.zone_id ? getZoneColor(String(customer.zone_id)) : '#999999';
  const size = isSelected ? 16 : 12;

  return (
    <Marker
      latitude={customer.lat}
      longitude={customer.lng}
      anchor="center"
      onClick={(e) => {
        e.originalEvent.stopPropagation();
        onClick();
      }}
    >
      <div
        className="relative group cursor-pointer"
        style={{
          width: size,
          height: size,
        }}
      >
        <div
          className="rounded-full border-2 border-white shadow-lg transition-all"
          style={{
            backgroundColor: color,
            width: size,
            height: size,
            transform: isSelected ? 'scale(1.2)' : 'scale(1)',
          }}
        />

        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-card text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {customer.company_name}
        </div>
      </div>
    </Marker>
  );
}
