/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useFreightRates, useCalibrateLanes } from "@/lib/hooks/use-freight-rates";
import { useWarehouses } from "@/lib/hooks/use-zones";
import { RateTable } from "@/components/freight/rate-table";
import { RateCalculator } from "@/components/freight/rate-calculator";
import { toast } from "sonner";

export default function FreightPage() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | undefined>();
  const [selectedZone, setSelectedZone] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'rates' | 'calculator'>('rates');

  const { data: rates = [], isLoading, refetch } = useFreightRates(selectedZone);
  const { data: warehouses = [] } = useWarehouses();
  const calibrateLanes = useCalibrateLanes();

  const handleCalibrate = async () => {
    try {
      toast.loading("Calibrating freight rates...");
      const result = await calibrateLanes.mutateAsync();
      toast.dismiss();
      toast.success(`Calibrated ${result.calibrated} lanes`);
      refetch();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Calibration failed");
    }
  };

  const lastCalibration = rates[0]?.created_at
    ? new Date(rates[0].created_at).toLocaleString()
    : "Never";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Freight Management</h1>
          <p className="text-gray-600">
            Manage freight rates and get LTL quotes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCalibrate}
            disabled={calibrateLanes.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {calibrateLanes.isPending ? "Calibrating..." : "Refresh Rates"}
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Last Calibration</p>
            <p className="font-semibold">{lastCalibration}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Active Rates</p>
            <p className="font-semibold">{rates.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-6 py-4 border-b-2 font-medium ${
                activeTab === 'rates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Rates
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-6 py-4 border-b-2 font-medium ${
                activeTab === 'calculator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rate Calculator
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'rates' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={selectedWarehouse || ''}
                    onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone
                  </label>
                  <select
                    value={selectedZone || ''}
                    onChange={(e) => setSelectedZone(e.target.value ? Number(e.target.value) : undefined)}
                    className="px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">All Zones</option>
                    <option value="1">Southeast</option>
                    <option value="2">Northeast</option>
                    <option value="3">Midwest</option>
                    <option value="4">West</option>
                  </select>
                </div>
              </div>

              <RateTable
                rates={rates.filter((r: any) =>
                  (!selectedWarehouse || r.origin_warehouse_id === selectedWarehouse)
                )}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeTab === 'calculator' && (
            <RateCalculator />
          )}
        </div>
      </div>
    </div>
  );
}
