'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Source, Layer, MapRef } from 'react-map-gl/mapbox';
import type { LayerProps } from 'react-map-gl/mapbox';

interface LassoToolProps {
  isDrawing: boolean;
  onPolygonComplete: (polygon: [number, number][]) => void;
  mapRef: React.RefObject<MapRef | null>;
}

export function LassoTool({ isDrawing, onPolygonComplete, mapRef }: LassoToolProps) {
  const [polygon, setPolygon] = useState<[number, number][]>([]);
  const isDrawingRef = useRef(isDrawing);
  const prevIsDrawingRef = useRef<boolean | null>(null);

  // Keep ref in sync
  useEffect(() => {
    isDrawingRef.current = isDrawing;

    // Only clear polygon when transitioning from true to false
    if (prevIsDrawingRef.current === true && isDrawing === false && polygon.length > 0) {
      // Use setTimeout to defer state update after effect completes
      const timer = setTimeout(() => setPolygon([]), 0);
      return () => clearTimeout(timer);
    }

    prevIsDrawingRef.current = isDrawing;
  }, [isDrawing, polygon.length]);

  const handleMapClick = useCallback((e: { lngLat: [number, number], mapCoords: [number, number] }) => {
    if (!isDrawingRef.current) return;

    // Add point to polygon on click
    const coords: [number, number] = [e.lngLat[0], e.lngLat[1]];
    setPolygon(prev => [...prev, coords]);
  }, []);

  const handleMapDblClick = useCallback(() => {
    if (!isDrawingRef.current) return;

    // Complete the polygon on double click
    if (polygon.length > 2) {
      // Close the polygon by adding the first point at the end if needed
      const finalPolygon = [...polygon];
      if (finalPolygon[0][0] !== finalPolygon[finalPolygon.length - 1][0] ||
          finalPolygon[0][1] !== finalPolygon[finalPolygon.length - 1][1]) {
        finalPolygon.push(finalPolygon[0]);
      }
      onPolygonComplete(finalPolygon);
      setPolygon([]);
    }
  }, [polygon, onPolygonComplete]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (isDrawing) {
      const clickHandler = (e: { lngLat: { lng: number; lat: number }; point: { x: number; y: number } }) => {
        handleMapClick({ lngLat: [e.lngLat.lng, e.lngLat.lat], mapCoords: [e.point.x, e.point.y] });
      };

      const dblClickHandler = (e: { preventDefault: () => void }) => {
        e.preventDefault();
        handleMapDblClick();
      };

      map.on('click', clickHandler);
      map.on('dblclick', dblClickHandler);

      return () => {
        map.off('click', clickHandler);
        map.off('dblclick', dblClickHandler);
      };
    }
  }, [isDrawing, mapRef, handleMapClick, handleMapDblClick]);

  if (!isDrawing || polygon.length === 0) return null;

  const lineGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: polygon,
    },
  };

  const lineLayer: LayerProps = {
    id: 'lasso-line',
    type: 'line',
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
      'line-dasharray': [2, 2],
    },
  };

  return (
    <Source id="lasso" type="geojson" data={lineGeoJSON}>
      <Layer {...lineLayer} />
    </Source>
  );
}

interface LassoControlsProps {
  isDrawing: boolean;
  onStartDrawing: () => void;
  onStopDrawing: () => void;
  onClearSelection: () => void;
}

export function LassoControls({
  isDrawing,
  onStartDrawing,
  onStopDrawing,
  onClearSelection,
}: LassoControlsProps) {
  return (
    <div className="absolute top-4 left-4 bg-card rounded-lg shadow-lg p-2 space-y-2 z-10">
      {!isDrawing ? (
        <button
          onClick={onStartDrawing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary transition-colors w-full"
        >
          Start Lasso Selection
        </button>
      ) : (
        <button
          onClick={onStopDrawing}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive transition-colors w-full"
        >
          Stop Drawing
        </button>
      )}

      <button
        onClick={onClearSelection}
        className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90 transition-colors w-full text-sm"
      >
        Clear Selection
      </button>
    </div>
  );
}
