"use client";

import { useState } from "react";
import { useUpdateFreightRate } from "@/lib/hooks/use-freight-rates";
import { toast } from "sonner";

interface FreightRate {
  id: string;
  origin_warehouse_id: number;
  destination_zone_id: number;
  city: string | null;
  state: string | null;
  rate_per_lb: number;
  dry_ltl_quote: number | null;
  valid_until: string | null;
  created_at: string;
  warehouses?: {
    id: number;
    code: string;
    name: string;
    city: string;
    state: string;
  };
  zones?: {
    id: number;
    name: string;
    code: string;
  };
}

interface RateTableProps {
  rates: FreightRate[];
  isLoading: boolean;
}

export function RateTable({ rates, isLoading }: RateTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const updateRate = useUpdateFreightRate();

  const getStatus = (validUntil: string | null) => {
    if (!validUntil) return { label: "Unknown", color: "gray" };

    const now = new Date();
    const expiry = new Date(validUntil);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: "Expired", color: "red" };
    } else if (daysUntilExpiry <= 2) {
      return { label: "Stale", color: "yellow" };
    } else {
      return { label: "Fresh", color: "green" };
    }
  };

  const handleEdit = (rate: FreightRate) => {
    setEditingId(rate.id);
    setEditValue(rate.rate_per_lb.toString());
  };

  const handleSave = async (rate: FreightRate) => {
    try {
      const newRate = parseFloat(editValue);
      if (isNaN(newRate) || newRate <= 0) {
        toast.error("Invalid rate value");
        return;
      }

      await updateRate.mutateAsync({
        id: rate.id,
        originWarehouseId: rate.origin_warehouse_id,
        destinationZoneId: rate.destination_zone_id,
        ratePerLb: newRate,
        city: rate.city || undefined,
        state: rate.state || undefined,
      });

      toast.success("Rate updated");
      setEditingId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading rates...</p>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No freight rates found. Click &quot;Refresh Rates&quot; to calibrate.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
              Warehouse
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
              Zone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
              Destination
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground/80 uppercase">
              Dry Quote
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground/80 uppercase">
              Rate/lb
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
              Valid Until
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground/80 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground/80 uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {rates.map((rate) => {
            const status = getStatus(rate.valid_until);
            const isEditing = editingId === rate.id;

            return (
              <tr key={rate.id} className="hover:bg-muted">
                <td className="px-4 py-3 text-sm">
                  {rate.warehouses?.code || 'N/A'}
                  <div className="text-xs text-muted-foreground/80">
                    {rate.warehouses?.city}, {rate.warehouses?.state}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {rate.zones?.name || `Zone ${rate.destination_zone_id}`}
                </td>
                <td className="px-4 py-3 text-sm">
                  {rate.city && rate.state ? `${rate.city}, ${rate.state}` : 'General'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {rate.dry_ltl_quote ? `$${rate.dry_ltl_quote.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.0001"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 px-2 py-1 border border-border rounded"
                      autoFocus
                    />
                  ) : (
                    `$${rate.rate_per_lb.toFixed(4)}`
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {rate.valid_until ? new Date(rate.valid_until).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      status.color === 'green'
                        ? 'bg-green-100 text-green-800'
                        : status.color === 'yellow'
                        ? 'bg-warning-100 text-warning-800'
                        : 'bg-destructive/20 text-destructive'
                    }`}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {isEditing ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleSave(rate)}
                        disabled={updateRate.isPending}
                        className="text-primary hover:text-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(rate)}
                      className="text-primary hover:text-primary"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
