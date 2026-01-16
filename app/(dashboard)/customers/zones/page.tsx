'use client';

import { useState } from 'react';
import { useZones, useUpdateZone } from '@/lib/hooks/use-zones';
import { useCustomers } from '@/lib/hooks/use-customers';
import { toast } from 'sonner';

export default function ZonesPage() {
  const { data: zones, isLoading } = useZones();
  const { data: customers = [] } = useCustomers();
  const updateZone = useUpdateZone();

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    name: string;
    color: string;
  } | null>(null);

  // Count customers per zone
  const getCustomerCount = (zoneId: string) => {
    return customers.filter((c) => c.zone_id?.toString() === zoneId).length;
  };

  const handleEdit = (zone: { id: number; name: string; color: string }) => {
    setEditingZoneId(zone.id.toString());
    setEditData({
      name: zone.name,
      color: zone.color,
    });
  };

  const handleSave = async (zoneId: string) => {
    if (!editData) return;

    try {
      await updateZone.mutateAsync({
        id: Number(zoneId),
        ...editData,
      });
      setEditingZoneId(null);
      setEditData(null);
      toast.success('Zone updated successfully');
    } catch {
      toast.error('Failed to update zone');
    }
  };

  const handleCancel = () => {
    setEditingZoneId(null);
    setEditData(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading zones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Zone Management</h1>
        <p className="text-gray-500 mt-1">
          Manage freight zones and their assignments
        </p>
      </div>

      {/* Zone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zones?.map((zone) => {
          const isEditing = editingZoneId === zone.id.toString();
          const customerCount = getCustomerCount(zone.id.toString());

          return (
            <div
              key={zone.id}
              className="bg-white rounded-lg shadow p-6 border-l-4"
              style={{ borderLeftColor: zone.color }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  {isEditing ? (
                    <>
                      <input
                        type="color"
                        value={editData?.color || zone.color}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev!,
                            color: e.target.value,
                          }))
                        }
                        className="w-12 h-12 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={editData?.name || ''}
                        onChange={(e) =>
                          setEditData((prev) => ({
                            ...prev!,
                            name: e.target.value,
                          }))
                        }
                        className="flex-1 text-xl font-semibold border border-gray-300 rounded px-3 py-2"
                        placeholder="Zone Name"
                      />
                    </>
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded"
                        style={{ backgroundColor: zone.color }}
                      />
                      <h2 className="text-xl font-semibold text-gray-900">{zone.name}</h2>
                    </>
                  )}
                </div>

                {!isEditing && (
                  <button
                    onClick={() => handleEdit(zone)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-4">{zone.description}</p>

              {/* Stats */}
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-500">Customers in Zone</div>
                <div className="text-2xl font-bold text-gray-900">{customerCount}</div>
              </div>

              {/* States */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">States</div>
                <div className="flex flex-wrap gap-1">
                  {zone.states?.map((state: string) => (
                    <span
                      key={state}
                      className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded"
                    >
                      {state}
                    </span>
                  ))}
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => handleSave(zone.id.toString())}
                    disabled={updateZone.isPending}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {updateZone.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={updateZone.isPending}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-1">About Zones</h3>
        <p className="text-sm text-blue-800">
          Freight zones are geographic regions used to calculate shipping rates. Each customer is
          assigned to a zone based on their state. Zone assignments can be changed from the
          customers page or map view.
        </p>
      </div>
    </div>
  );
}
