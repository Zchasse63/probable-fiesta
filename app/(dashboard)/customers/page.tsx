'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomers } from '@/lib/hooks/use-customers';
import { useZones } from '@/lib/hooks/use-zones';
import { CustomerTable } from '@/components/customers/customer-table';
import { ImportModal } from '@/components/customers/import-modal';
import { useBulkUpdateCustomerZone } from '@/lib/hooks/use-customers';
import { toast } from 'sonner';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const CUSTOMER_TYPES = [
  { value: 'food_distributor', label: 'Food Distributor' },
  { value: 'paper_janitorial', label: 'Paper/Janitorial' },
  { value: 'other', label: 'Other' },
];

export const dynamic = 'force-dynamic';

export default function CustomersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    zone_id: undefined as number | undefined,
    state: '',
    customer_type: '',
    search: '',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showZoneSelector, setShowZoneSelector] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');

  const { data: customers, isLoading } = useCustomers(filters);
  const { data: zones } = useZones();
  const bulkUpdateZone = useBulkUpdateCustomerZone();

  // Filter by search term (client-side for now)
  const filteredCustomers = customers?.filter((customer) => {
    if (!filters.search) return true;
    return customer.company_name
      .toLowerCase()
      .includes(filters.search.toLowerCase());
  }) || [];

  // Calculate stats
  const totalCustomers = filteredCustomers.length;
  const customersByZone = zones?.map((zone) => ({
    zone,
    count: filteredCustomers.filter((c) => c.zone_id === zone.id).length,
  })) || [];

  const handleBulkAction = async (action: string) => {
    if (selectedIds.length === 0) {
      toast.error('Please select customers first');
      return;
    }

    switch (action) {
      case 'delete':
        if (confirm(`Delete ${selectedIds.length} customers?`)) {
          toast.info('Bulk delete feature scheduled for Phase 5');
        }
        break;
      case 'export':
        toast.info('CSV export feature scheduled for Phase 5');
        break;
      case 'assign_zone':
        setShowZoneSelector(true);
        break;
    }
  };

  const handleZoneAssignment = async () => {
    if (!selectedZoneId) {
      toast.error('Please select a zone');
      return;
    }

    const zoneIdNumber = parseInt(selectedZoneId, 10);
    if (isNaN(zoneIdNumber) || zoneIdNumber < 1 || zoneIdNumber > 4) {
      toast.error('Invalid zone selected');
      return;
    }

    await bulkUpdateZone.mutateAsync({
      customerIds: selectedIds,
      zoneId: zoneIdNumber,
    });
    setSelectedIds([]);
    setShowZoneSelector(false);
    setSelectedZoneId('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">
            Manage customer locations and freight zones
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-success text-success-foreground rounded hover:bg-success"
          >
            Import Customers
          </button>
          <button
            onClick={() => router.push('/customers/map')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary"
          >
            View Map
          </button>
          <button
            onClick={() => router.push('/customers/new')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary"
          >
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-card p-4 rounded-lg shadow">
          <div className="text-sm text-muted-foreground">Total Customers</div>
          <div className="text-2xl font-bold">{totalCustomers}</div>
        </div>
        {customersByZone.map(({ zone, count }) => (
          <div key={zone.id} className="bg-card p-4 rounded-lg shadow">
            <div className="text-sm text-muted-foreground">{zone.name}</div>
            <div className="text-2xl font-bold">{count}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Zone
            </label>
            <select
              value={filters.zone_id || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  zone_id: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
            >
              <option value="">All Zones</option>
              {zones?.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
              className="w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
            >
              <option value="">All States</option>
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Customer Type
            </label>
            <select
              value={filters.customer_type}
              onChange={(e) =>
                setFilters({ ...filters, customer_type: e.target.value })
              }
              className="w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
            >
              <option value="">All Types</option>
              {CUSTOMER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Company name..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-4 pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <button
              onClick={() => handleBulkAction('assign_zone')}
              className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary"
            >
              Assign Zone
            </button>
            <button
              onClick={() => handleBulkAction('export')}
              className="px-3 py-1 bg-success text-success-foreground rounded text-sm hover:bg-success"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-destructive"
            >
              Delete
            </button>
          </div>
        )}

        {/* Zone Selector Modal */}
        {showZoneSelector && (
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-foreground/80">
                Select Zone:
              </label>
              <select
                value={selectedZoneId}
                onChange={(e) => setSelectedZoneId(e.target.value)}
                className="rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
              >
                <option value="">Choose a zone...</option>
                {zones?.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleZoneAssignment}
                className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setShowZoneSelector(false);
                  setSelectedZoneId('');
                }}
                className="px-3 py-1 bg-muted-foreground/60 text-white rounded text-sm hover:bg-muted-foreground/80"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg shadow">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        )}
      </div>

      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} />
    </div>
  );
}
