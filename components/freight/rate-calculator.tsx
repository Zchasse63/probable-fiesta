"use client";

import { useState } from "react";
import { useWarehouses } from "@/lib/hooks/use-zones";
import { useGetFreightQuote, useUpdateFreightRate } from "@/lib/hooks/use-freight-rates";
import { getZoneFromZip } from "@/lib/utils/zone-lookup";
import { toast } from "sonner";

export function RateCalculator() {
  const [originWarehouseId, setOriginWarehouseId] = useState<number | null>(null);
  const [destinationZip, setDestinationZip] = useState("");
  const [weight, setWeight] = useState("7500");
  const [pickupDate, setPickupDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const { data: warehouses = [] } = useWarehouses();
  const getQuote = useGetFreightQuote();
  const updateRate = useUpdateFreightRate();

  const handleCalculate = async () => {
    if (!originWarehouseId) {
      toast.error("Please select a warehouse");
      return;
    }

    if (!destinationZip) {
      toast.error("Please enter destination ZIP");
      return;
    }

    if (!weight || parseFloat(weight) <= 0) {
      toast.error("Please enter valid weight");
      return;
    }

    try {
      await getQuote.mutateAsync({
        originWarehouseId,
        destinationZip,
        weight: parseFloat(weight),
        pickupDate,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to get quote");
    }
  };

  const handleSaveToRates = async () => {
    if (!getQuote.data || !originWarehouseId) {
      toast.error("No quote to save");
      return;
    }

    const destinationZoneId = getZoneFromZip(destinationZip);
    if (!destinationZoneId) {
      toast.error("Could not determine zone from ZIP code");
      return;
    }

    try {
      const ratePerLb = getQuote.data.reeferEstimate / parseFloat(weight);

      await updateRate.mutateAsync({
        originWarehouseId,
        destinationZoneId,
        ratePerLb,
        validUntilDays: 7,
      });

      toast.success("Rate saved to freight rates");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save rate");
    }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Manual Quote Calculator</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Origin Warehouse *
            </label>
            <select
              value={originWarehouseId || ''}
              onChange={(e) => setOriginWarehouseId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-border rounded"
            >
              <option value="">Select warehouse</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Destination ZIP *
            </label>
            <input
              type="text"
              value={destinationZip}
              onChange={(e) => setDestinationZip(e.target.value)}
              placeholder="33101"
              className="w-full px-3 py-2 border border-border rounded"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Weight (lbs) *
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-1">
              Pickup Date *
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-border rounded"
            />
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={getQuote.isPending}
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
        >
          {getQuote.isPending ? "Calculating..." : "Calculate Quote"}
        </button>

        {getQuote.data && (
          <div className="mt-6 p-6 bg-muted rounded-lg space-y-4">
            <h4 className="font-semibold text-lg">Quote Results</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">"
</p>
                <p className="text-2xl font-bold">${getQuote.data.dryQuote.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reefer Estimate</p>
                <p className="text-2xl font-bold text-primary">
                  ${getQuote.data.reeferEstimate.toFixed(2)}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Confidence Range</p>
              <p className="text-lg font-semibold">
                ${getQuote.data.rangeLow.toFixed(2)} - ${getQuote.data.rangeHigh.toFixed(2)}
              </p>
            </div>

            <div className="bg-card p-4 rounded border border-border">
              <p className="text-sm font-medium mb-2">Factors Applied:</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Multiplier:</span>
                  <span className="font-semibold">{getQuote.data.factors.base}×</span>
                </div>
                <div className="flex justify-between">
                  <span>Origin Modifier:</span>
                  <span className="font-semibold">
                    {getQuote.data.factors.origin === 1
                      ? '—'
                      : `${((getQuote.data.factors.origin - 1) * 100).toFixed(0)}%`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Season Modifier:</span>
                  <span className="font-semibold">
                    {getQuote.data.factors.season === 1
                      ? '—'
                      : `${((getQuote.data.factors.season - 1) * 100).toFixed(0)}%`}
                  </span>
                </div>
              </div>
            </div>

            {getQuote.data.carrier && (
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-semibold">{getQuote.data.carrier.name}</p>
              </div>
            )}

            {getQuote.data.deliveryDate && (
              <div>
                <p className="text-sm text-muted-foreground">Est. Delivery</p>
                <p className="font-semibold">
                  {new Date(getQuote.data.deliveryDate).toLocaleDateString()}
                  {getQuote.data.transitDays && ` (${getQuote.data.transitDays} days)`}
                </p>
              </div>
            )}

            <button
              onClick={handleSaveToRates}
              disabled={updateRate.isPending}
              className="w-full px-4 py-2 bg-success text-success-foreground rounded hover:bg-success/90 disabled:opacity-50"
            >
              {updateRate.isPending ? "Saving..." : "Save to Rates"}
            </button>
          </div>
        )}

        {getQuote.isError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded">
            <p className="text-destructive">
              {getQuote.error instanceof Error ? getQuote.error.message : "Failed to get quote"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
