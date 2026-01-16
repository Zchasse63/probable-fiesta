import { useState, useCallback } from 'react';

interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
}

interface MapFilters {
  zoneId?: string;
  search?: string;
}

interface ClusterConfig {
  radius: number;
  maxZoom: number;
}

export function useCustomerMap() {
  const [viewport, setViewport] = useState<Viewport>({
    latitude: 33.749, // Atlanta
    longitude: -84.388,
    zoom: 5,
  });

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showZones, setShowZones] = useState(true);
  const [filters, setFilters] = useState<MapFilters>({});

  const clusterConfig: ClusterConfig = {
    radius: 40,
    maxZoom: 16,
  };

  const toggleZones = useCallback(() => {
    setShowZones((prev) => !prev);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCustomerId(null);
  }, []);

  return {
    viewport,
    setViewport,
    selectedCustomerId,
    setSelectedCustomerId,
    clearSelection,
    showZones,
    toggleZones,
    filters,
    setFilters,
    clusterConfig,
  };
}
