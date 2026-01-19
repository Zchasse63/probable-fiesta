'use client';

import { useState } from 'react';
import { useBulkUpdateCustomerZone } from '@/lib/hooks/use-customers';
import { useZones } from '@/lib/hooks/use-zones';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ZoneAssignmentProps {
  selectedCustomerIds: string[];
  onComplete: () => void;
}

export function ZoneAssignment({
  selectedCustomerIds,
  onComplete,
}: ZoneAssignmentProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: zones, isLoading: zonesLoading } = useZones();
  const bulkUpdateZone = useBulkUpdateCustomerZone();

  const selectedZone = zones?.find((z) => z.id.toString() === selectedZoneId);

  const handleApply = () => {
    if (!selectedZoneId) {
      toast.error('Please select a zone');
      return;
    }
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    if (!selectedZoneId) return;

    const zoneIdNumber = parseInt(selectedZoneId, 10);
    if (isNaN(zoneIdNumber) || zoneIdNumber < 1 || zoneIdNumber > 4) {
      toast.error('Invalid zone selected');
      setShowConfirmation(false);
      return;
    }

    try {
      await bulkUpdateZone.mutateAsync({
        customerIds: selectedCustomerIds,
        zoneId: zoneIdNumber,
      });
      setShowConfirmation(false);
      setSelectedZoneId('');
      onComplete();
    } catch (error) {
      // Error is handled by the mutation hook
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  if (selectedCustomerIds.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          Select customers from the table to assign them to a zone
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Bulk Zone Assignment
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="zone-select"
            className="block text-sm font-medium text-foreground/80 mb-2"
          >
            Select Zone ({selectedCustomerIds.length} customer
            {selectedCustomerIds.length !== 1 ? 's' : ''} selected)
          </label>
          <select
            id="zone-select"
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            disabled={zonesLoading}
            className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">-- Select a zone --</option>
            {zones?.map((zone) => (
              <option key={zone.id} value={zone.id.toString()}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {selectedZoneId && selectedZone && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedZone.color }}
            />
            <span className="text-sm font-medium text-foreground/80">
              {selectedZone.name}
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleApply}
            disabled={!selectedZoneId || bulkUpdateZone.isPending}
            variant="primary"
          >
            {bulkUpdateZone.isPending ? 'Applying...' : 'Apply Zone'}
          </Button>
        </div>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Confirm Zone Assignment
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Assign {selectedCustomerIds.length} customer
              {selectedCustomerIds.length !== 1 ? 's' : ''} to{' '}
              <span className="font-semibold">{selectedZone?.name}</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={handleCancel}
                variant="ghost"
                disabled={bulkUpdateZone.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                variant="primary"
                disabled={bulkUpdateZone.isPending}
              >
                {bulkUpdateZone.isPending ? 'Assigning...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
