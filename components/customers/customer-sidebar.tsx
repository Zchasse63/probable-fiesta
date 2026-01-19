'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUpdateCustomer } from '@/lib/hooks/use-customers';
import { useZones } from '@/lib/hooks/use-zones';
import { getZoneColor, getZoneName } from '@/lib/mapbox/zones';
import type { Row } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';

interface CustomerSidebarProps {
  customer: Row<'customers'> & { zones: Row<'zones'> | null };
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerSidebar({ customer, isOpen, onClose }: CustomerSidebarProps) {
  const router = useRouter();
  const updateCustomer = useUpdateCustomer();
  const { data: zones } = useZones();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    company_name: customer.company_name,
    zone_id: customer.zone_id,
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      company_name: customer.company_name,
      zone_id: customer.zone_id,
    });
  };

  const handleSave = async () => {
    try {
      await updateCustomer.mutateAsync({
        id: customer.id,
        company_name: editData.company_name,
        zone_id: editData.zone_id,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const handleViewFullDetails = () => {
    router.push(`/customers/${customer.id}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[400px] bg-card shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted">
            {isEditing ? (
              <input
                type="text"
                value={editData.company_name}
                onChange={(e) =>
                  setEditData((prev) => ({ ...prev, company_name: e.target.value }))
                }
                className="flex-1 mr-2 px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-primary"
                placeholder="Company Name"
              />
            ) : (
              <h2 className="text-xl font-semibold text-foreground truncate">
                {customer.company_name}
              </h2>
            )}
            <button
              onClick={onClose}
              className="ml-4 p-2 text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent rounded-md transition-colors"
              aria-label="Close"
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Address Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                  Address
                </h3>
                <div className="space-y-2 text-foreground">
                  <p>{customer.address}</p>
                  <p>
                    {customer.city}
                    {customer.city && customer.state && ', '}
                    {customer.state} {customer.zip}
                  </p>
                </div>
              </div>

              {/* Zone Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                  Zone
                </h3>
                {isEditing ? (
                  <select
                    value={editData.zone_id || ''}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        zone_id: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded-md focus:ring-2 focus:ring-ring focus:border-primary"
                  >
                    <option value="">No Zone</option>
                    {zones?.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div>
                    {customer.zone_id ? (
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                        style={{ backgroundColor: getZoneColor(String(customer.zone_id)) }}
                      >
                        {getZoneName(String(customer.zone_id))}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">No zone assigned</span>
                    )}
                  </div>
                )}
              </div>

              {/* Contact Information */}
              {(customer.contact_name ||
                customer.contact_email ||
                customer.contact_phone) && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {customer.contact_name && (
                      <div className="flex items-center text-foreground">
                        <svg
                          className="w-5 h-5 mr-2 text-muted-foreground/60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <span>{customer.contact_name}</span>
                      </div>
                    )}
                    {customer.contact_email && (
                      <div className="flex items-center text-foreground">
                        <svg
                          className="w-5 h-5 mr-2 text-muted-foreground/60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={`mailto:${customer.contact_email}`}
                          className="text-primary hover:text-primary"
                        >
                          {customer.contact_email}
                        </a>
                      </div>
                    )}
                    {customer.contact_phone && (
                      <div className="flex items-center text-foreground">
                        <svg
                          className="w-5 h-5 mr-2 text-muted-foreground/60"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <a
                          href={`tel:${customer.contact_phone}`}
                          className="text-primary hover:text-primary"
                        >
                          {customer.contact_phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Customer Type */}
              {customer.customer_type && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Customer Type
                  </h3>
                  <p className="text-foreground capitalize">
                    {customer.customer_type.replace('_', ' ')}
                  </p>
                </div>
              )}

              {/* Notes */}
              {customer.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Notes
                  </h3>
                  <p className="text-foreground whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-border px-6 py-4 bg-muted">
            {isEditing ? (
              <div className="flex space-x-3">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={updateCustomer.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  className="flex-1"
                  disabled={updateCustomer.isPending}
                >
                  {updateCustomer.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  onClick={handleEdit}
                  className="w-full"
                >
                  Edit Customer
                </Button>
                <Button
                  variant="primary"
                  onClick={handleViewFullDetails}
                  className="w-full"
                >
                  View Full Details
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
