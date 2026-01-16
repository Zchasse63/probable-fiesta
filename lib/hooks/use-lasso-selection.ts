import { useState, useCallback } from 'react';
import { isPointInPolygon } from '@/lib/utils/geometry';

interface Customer {
  id: string;
  lat: number | null;
  lng: number | null;
}

export function useLassoSelection(customers: Customer[]) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygon, setPolygon] = useState<[number, number][]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const startLasso = useCallback(() => {
    setIsDrawing(true);
    setPolygon([]);
    setSelectedCustomers([]);
  }, []);

  const stopLasso = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSelection = useCallback(() => {
    setPolygon([]);
    setSelectedCustomers([]);
    setIsDrawing(false);
  }, []);

  const onPolygonComplete = useCallback(
    (completedPolygon: [number, number][]) => {
      setPolygon(completedPolygon);
      setIsDrawing(false);

      // Find all customers within polygon
      const selected = customers
        .filter((customer) => {
          if (!customer.lat || !customer.lng) {
            return false;
          }

          const point: [number, number] = [customer.lng, customer.lat];
          return isPointInPolygon(point, completedPolygon);
        })
        .map((customer) => customer.id);

      setSelectedCustomers(selected);
    },
    [customers]
  );

  return {
    isDrawing,
    polygon,
    selectedCustomers,
    startLasso,
    stopLasso,
    clearSelection,
    onPolygonComplete,
  };
}
