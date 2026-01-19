'use client';

import { useState } from 'react';
import { useZones } from '@/lib/hooks/use-zones';
import { getZoneByState } from '@/lib/mapbox/zones';
import type { Row, Insert } from '@/lib/supabase/types';
import { toast } from 'sonner';

interface CustomerFormProps {
  customer?: Row<'customers'>;
  onSubmit: (data: Partial<Insert<'customers'>>) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

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

export function CustomerForm({ customer, onSubmit, onCancel, isSubmitting = false }: CustomerFormProps) {
  const { data: zones } = useZones();
  const [geocoding, setGeocoding] = useState(false);

  const [formData, setFormData] = useState<Partial<Insert<'customers'>>>({
    company_name: customer?.company_name || '',
    address: customer?.address || '',
    city: customer?.city || '',
    state: customer?.state || '',
    zip: customer?.zip || '',
    customer_type: customer?.customer_type || 'other',
    contact_name: customer?.contact_name || '',
    contact_email: customer?.contact_email || '',
    contact_phone: customer?.contact_phone || '',
    notes: customer?.notes || '',
    zone_id: customer?.zone_id || null,
    lat: customer?.lat || null,
    lng: customer?.lng || null,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Auto-assign zone when state changes
    if (name === 'state') {
      const zoneId = getZoneByState(value);
      if (zoneId) {
        setFormData((prev) => ({
          ...prev,
          zone_id: Number(zoneId),
        }));
      }
    }
  };

  const [originalAddress, setOriginalAddress] = useState<{
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  const handleNormalizeAddress = async () => {
    const fullAddress = [formData.address, formData.city, formData.state, formData.zip]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      toast.error('Please enter an address first');
      return;
    }

    setGeocoding(true);

    try {
      const response = await fetch('/api/ai/normalize-address', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress }),
      });

      if (!response.ok) {
        throw new Error('Address normalization failed');
      }

      const result = await response.json();
      const normalized = result.normalized;

      // Store original for diff display
      if (result.corrections && result.corrections.length > 0) {
        setOriginalAddress({
          address: formData.address || '',
          city: formData.city || '',
          state: formData.state || '',
          zip: formData.zip || '',
        });

        setFormData((prev) => ({
          ...prev,
          address: normalized.street || prev.address,
          city: normalized.city || prev.city,
          state: normalized.state || prev.state,
          zip: normalized.zip || prev.zip,
        }));

        setShowDiff(true);

        toast.success(
          `Address normalized: ${result.corrections.join(', ')}`
        );
      } else {
        toast.info('Address is already normalized');
      }
    } catch (error) {
      toast.error('Failed to normalize address');
    } finally {
      setGeocoding(false);
    }
  };

  const handleRevertNormalization = () => {
    if (originalAddress) {
      setFormData((prev) => ({
        ...prev,
        ...originalAddress,
      }));
      setShowDiff(false);
      setOriginalAddress(null);
      toast.info('Reverted to original address');
    }
  };

  const handleGeocodeAddress = async () => {
    const fullAddress = [formData.address, formData.city, formData.state, formData.zip]
      .filter(Boolean)
      .join(', ');

    if (!fullAddress) {
      toast.error('Please enter an address first');
      return;
    }

    setGeocoding(true);

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress }),
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const result = await response.json();

      setFormData((prev) => ({
        ...prev,
        lat: result.latitude,
        lng: result.longitude,
      }));

      toast.success(`Address geocoded (confidence: ${(result.confidence * 100).toFixed(0)}%)`);
    } catch (error) {
      toast.error('Failed to geocode address');
    } finally {
      setGeocoding(false);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.company_name) {
      toast.error('Company name is required');
      return false;
    }

    if (formData.contact_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contact_email)) {
        toast.error('Invalid email format');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Name */}
        <div className="col-span-2">
          <label htmlFor="company_name" className="block text-sm font-medium text-foreground/80">
            Company Name *
          </label>
          <input
            type="text"
            id="company_name"
            name="company_name"
            required
            value={formData.company_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Address */}
        <div className="col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-foreground/80">
            Address
          </label>
          <div className="mt-1 flex space-x-2">
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => handleNormalizeAddress()}
              disabled={geocoding}
              className="px-3 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-muted-foreground/60 whitespace-nowrap text-sm"
            >
              {geocoding ? 'Normalizing...' : 'Normalize Address'}
            </button>
            <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={geocoding}
              className="px-4 py-2 bg-success text-success-foreground rounded hover:bg-success/90 disabled:bg-muted-foreground/60 whitespace-nowrap"
            >
              {geocoding ? 'Geocoding...' : 'Geocode'}
            </button>
          </div>
          {showDiff && originalAddress && (
            <div className="mt-2 p-3 bg-primary-50 border border-primary-200 rounded text-sm text-foreground/80">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold text-primary mb-1">Address Normalized:</p>
                  <div className="space-y-1 text-foreground/80">
                    {originalAddress.address !== formData.address && (
                      <div>
                        <span className="line-through text-destructive">{originalAddress.address}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{formData.address}</span>
                      </div>
                    )}
                    {originalAddress.city !== formData.city && (
                      <div>
                        <span className="line-through text-destructive">{originalAddress.city}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{formData.city}</span>
                      </div>
                    )}
                    {originalAddress.state !== formData.state && (
                      <div>
                        <span className="line-through text-destructive">{originalAddress.state}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{formData.state}</span>
                      </div>
                    )}
                    {originalAddress.zip !== formData.zip && (
                      <div>
                        <span className="line-through text-destructive">{originalAddress.zip}</span>
                        {' → '}
                        <span className="text-green-600 font-medium">{formData.zip}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRevertNormalization}
                  className="ml-2 px-2 py-1 text-xs bg-accent hover:bg-muted rounded"
                >
                  Revert
                </button>
              </div>
            </div>
          )}
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-foreground/80">
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* State */}
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-foreground/80">
            State
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          >
            <option value="">Select State</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        {/* ZIP */}
        <div>
          <label htmlFor="zip" className="block text-sm font-medium text-foreground/80">
            ZIP Code
          </label>
          <input
            type="text"
            id="zip"
            name="zip"
            value={formData.zip}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Zone */}
        <div>
          <label htmlFor="zone_id" className="block text-sm font-medium text-foreground/80">
            Zone
          </label>
          <select
            id="zone_id"
            name="zone_id"
            value={formData.zone_id ?? ''}
            onChange={(e) => {
              const value = e.target.value;
              setFormData((prev) => ({
                ...prev,
                zone_id: value ? Number(value) : null,
              }));
            }}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          >
            <option value="">Select Zone</option>
            {zones?.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Type */}
        <div>
          <label htmlFor="customer_type" className="block text-sm font-medium text-foreground/80">
            Customer Type
          </label>
          <select
            id="customer_type"
            name="customer_type"
            value={formData.customer_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          >
            {CUSTOMER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contact Name */}
        <div>
          <label htmlFor="contact_name" className="block text-sm font-medium text-foreground/80">
            Contact Name
          </label>
          <input
            type="text"
            id="contact_name"
            name="contact_name"
            value={formData.contact_name ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Contact Email */}
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-foreground/80">
            Contact Email
          </label>
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Contact Phone */}
        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-foreground/80">
            Contact Phone
          </label>
          <input
            type="tel"
            id="contact_phone"
            name="contact_phone"
            value={formData.contact_phone ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Notes */}
        <div className="col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-foreground/80">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-ring"
          />
        </div>

        {/* Coordinates (read-only) */}
        {(formData.lat || formData.lng) && (
          <div className="col-span-2 text-sm text-muted-foreground/80">
            Coordinates: {formData.lat?.toFixed(6)}, {formData.lng?.toFixed(6)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-md text-foreground/80 hover:bg-accent"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:bg-muted-foreground/60"
        >
          {isSubmitting ? 'Saving...' : customer ? 'Update Customer' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
}
