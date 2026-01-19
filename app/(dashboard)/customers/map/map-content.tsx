'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useCustomerMap } from '@/lib/hooks/use-customer-map';
import { useLassoSelection } from '@/lib/hooks/use-lasso-selection';
import { CustomerMap } from '@/components/map/customer-map';
import { LassoTool, LassoControls } from '@/components/map/lasso-tool';
import { CustomerSidebar } from '@/components/customers/customer-sidebar';
import { ZoneAssignment } from '@/components/customers/zone-assignment';
import type { MapRef } from 'react-map-gl/mapbox';

export default function CustomersMapContent() {
  const mapRef = useRef<MapRef>(null);
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('selected');

  const { data: customers = [] } = useCustomers();
  const {
    viewport,
    setViewport,
    selectedCustomerId,
    setSelectedCustomerId,
    showZones,
    toggleZones,
    clusterConfig,
  } = useCustomerMap();

  const {
    isDrawing,
    selectedCustomers,
    startLasso,
    stopLasso,
    clearSelection,
    onPolygonComplete,
  } = useLassoSelection(customers);

  const [showSidebar, setShowSidebar] = useState(!!selectedId);
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Set selected customer from URL - no state updates in effect
  useEffect(() => {
    if (selectedId && customers.length > 0) {
      const customer = customers.find((c) => c.id === selectedId);
      if (!customer) return;

      // Use callback form to avoid state updates
      setSelectedCustomerId(selectedId);

      // Center map on customer if coordinates available
      if (customer.lat && customer.lng) {
        setViewport({
          latitude: customer.lat,
          longitude: customer.lng,
          zoom: 12,
        });
      }
    }
  }, [selectedId, customers, setSelectedCustomerId, setViewport]);

  const handleCustomerSelect = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
    if (customerId) {
      setShowSidebar(true);
    } else {
      setShowSidebar(false);
    }
  };

  const handleZoneAssignmentComplete = () => {
    clearSelection();
  };

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      {/* Map */}
      <CustomerMap
        ref={mapRef}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onCustomerSelect={handleCustomerSelect}
        showZones={showZones}
        viewport={viewport}
        onViewportChange={setViewport}
        clusterConfig={clusterConfig}
      />

      {/* Lasso Tool Overlay */}
      {isDrawing && <LassoTool isDrawing={isDrawing} onPolygonComplete={onPolygonComplete} mapRef={mapRef} />}

      {/* Map Controls */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        <button
          onClick={toggleZones}
          className={`px-4 py-2 rounded-lg shadow-lg transition-colors ${
            showZones
              ? 'bg-primary text-primary-foreground hover:bg-primary'
              : 'bg-card text-foreground/80 hover:bg-muted'
          }`}
        >
          {showZones ? 'Hide' : 'Show'} Zones
        </button>
      </div>

      {/* Lasso Controls */}
      <LassoControls
        isDrawing={isDrawing}
        onStartDrawing={startLasso}
        onStopDrawing={stopLasso}
        onClearSelection={clearSelection}
      />

      {/* Selected Customers Panel */}
      {selectedCustomers.length > 0 && (
        <div className="absolute top-4 right-4 w-80 bg-card rounded-lg shadow-xl p-4 z-10 max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">
              Selected Customers ({selectedCustomers.length})
            </h3>
            <button
              onClick={clearSelection}
              className="text-muted-foreground/60 hover:text-muted-foreground"
              aria-label="Clear selection"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {customers
              .filter((c) => selectedCustomers.includes(c.id))
              .map((customer) => (
                <div
                  key={customer.id}
                  className="p-2 bg-muted rounded hover:bg-accent cursor-pointer"
                  onClick={() => handleCustomerSelect(customer.id)}
                >
                  <div className="font-medium text-sm">{customer.company_name}</div>
                  <div className="text-xs text-muted-foreground/80">
                    {customer.city}, {customer.state}
                  </div>
                </div>
              ))}
          </div>

          <div className="border-t pt-3">
            <ZoneAssignment
              selectedCustomerIds={selectedCustomers}
              onComplete={handleZoneAssignmentComplete}
            />
          </div>
        </div>
      )}

      {/* Customer Detail Sidebar */}
      {selectedCustomer && (
        <CustomerSidebar
          customer={selectedCustomer}
          isOpen={showSidebar}
          onClose={() => {
            setShowSidebar(false);
            setSelectedCustomerId(null);
          }}
        />
      )}
    </div>
  );
}
