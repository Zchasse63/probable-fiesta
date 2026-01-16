'use client';

import { useMemo, forwardRef } from 'react';
import Map, { NavigationControl, MapRef } from 'react-map-gl/mapbox';
import Supercluster from 'supercluster';
import { MAPBOX_CONFIG } from '@/lib/mapbox/config';
import { CustomerMarker } from './customer-marker';
import { ClusterMarker } from './cluster-marker';
import { ZoneLayer } from './zone-layer';

import 'mapbox-gl/dist/mapbox-gl.css';

interface Customer {
  id: string;
  company_name: string;
  lat: number | null;
  lng: number | null;
  zone_id: number | null;
}

interface CustomerMapProps {
  customers: Customer[];
  selectedCustomerId?: string | null;
  onCustomerSelect?: (customerId: string | null) => void;
  showZones?: boolean;
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  onViewportChange: (viewport: { latitude: number; longitude: number; zoom: number }) => void;
  clusterConfig?: {
    radius: number;
    maxZoom: number;
  };
}

export const CustomerMap = forwardRef<MapRef, CustomerMapProps>(function CustomerMap({
  customers,
  selectedCustomerId,
  onCustomerSelect,
  showZones = true,
  viewport,
  onViewportChange,
  clusterConfig = { radius: 40, maxZoom: 16 },
}, mapRef) {

  // Filter customers with valid coordinates
  const validCustomers = useMemo(
    () =>
      customers.filter(
        (c) => c.lat !== null && c.lng !== null
      ) as Array<Customer & { lat: number; lng: number }>,
    [customers]
  );

  // Create supercluster instance
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: clusterConfig.radius,
      maxZoom: clusterConfig.maxZoom,
    });

    cluster.load(
      validCustomers.map((customer) => ({
        type: 'Feature' as const,
        properties: {
          cluster: false,
          customerId: customer.id,
          customer,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [customer.lng, customer.lat],
        },
      }))
    );

    return cluster;
  }, [validCustomers, clusterConfig]);

  // Get clusters for current viewport - use full world bbox initially
  // Updated on map move via state
  const { clusters, points } = useMemo(() => {
    // Use full world bounds for initial render or when map not ready
    const bbox: [number, number, number, number] = [-180, -85, 180, 85];
    const zoom = Math.floor(viewport.zoom);
    const clusterData = supercluster.getClusters(bbox, zoom);

    const clusterMarkers = clusterData.filter((c) => c.properties.cluster);
    const pointMarkers = clusterData.filter((c) => !c.properties.cluster);

    return {
      clusters: clusterMarkers.map((c) => ({
        id: c.id as number,
        latitude: c.geometry.coordinates[1],
        longitude: c.geometry.coordinates[0],
        point_count: c.properties.point_count,
      })),
      points: pointMarkers.map((p) => p.properties.customer as Customer & {
        lat: number;
        lng: number;
      }),
    };
  }, [supercluster, viewport.zoom, viewport.latitude, viewport.longitude]);

  const handleClusterClick = (clusterId: number) => {
    const expansionZoom = Math.min(
      supercluster.getClusterExpansionZoom(clusterId),
      20
    );

    const clusterData = supercluster
      .getClusters([-180, -85, 180, 85], Math.floor(viewport.zoom))
      .find((c) => c.id === clusterId);

    if (clusterData) {
      onViewportChange({
        ...viewport,
        latitude: clusterData.geometry.coordinates[1],
        longitude: clusterData.geometry.coordinates[0],
        zoom: expansionZoom,
      });
    }
  };

  return (
    <div className="w-full h-full">
      <Map
        ref={mapRef}
        {...viewport}
        onMove={(evt) => onViewportChange(evt.viewState)}
        mapStyle={MAPBOX_CONFIG.styles.light}
        mapboxAccessToken={MAPBOX_CONFIG.accessToken}
        onClick={() => onCustomerSelect?.(null)}
      >
        <NavigationControl position="top-right" />

        <ZoneLayer visible={showZones} />

        {/* Render clusters */}
        {clusters.map((cluster) => (
          <ClusterMarker
            key={`cluster-${cluster.id}`}
            cluster={cluster}
            onClick={() => handleClusterClick(cluster.id)}
          />
        ))}

        {/* Render individual customer markers */}
        {points.map((customer) => (
          <CustomerMarker
            key={customer.id}
            customer={customer}
            isSelected={customer.id === selectedCustomerId}
            onClick={() => onCustomerSelect?.(customer.id)}
          />
        ))}
      </Map>
    </div>
  );
});
