'use client';

import { useRouter, useParams } from 'next/navigation';
import { useCustomer, useUpdateCustomer, useDeleteCustomer } from '@/lib/hooks/use-customers';
import { CustomerForm } from '@/components/customers/customer-form';
import { CustomerMap } from '@/components/map/customer-map';
import { useCustomerMap } from '@/lib/hooks/use-customer-map';
import type { Insert } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const { data: customer, isLoading } = useCustomer(customerId);
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const { setViewport, clusterConfig } = useCustomerMap();

  const handleSubmit = async (data: Partial<Insert<'customers'>>) => {
    await updateCustomer.mutateAsync({
      id: customerId,
      ...data,
    });
    router.push('/customers');
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      await deleteCustomer.mutateAsync(customerId);
      router.push('/customers');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground mb-4">The customer you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/customers')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  const customerWithCoords = customer.lat && customer.lng
    ? [{
        ...customer,
        lat: customer.lat,
        lng: customer.lng,
      }]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/customers')}
            className="text-sm text-muted-foreground hover:text-foreground/80 mb-2 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Customers
          </button>
          <h1 className="text-2xl font-bold">{customer.company_name}</h1>
        </div>

        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive"
        >
          Delete Customer
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button className="border-b-2 border-primary py-4 px-1 text-sm font-medium text-primary">
            Details
          </button>
          <button className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-muted-foreground hover:text-foreground/80 hover:border-border">
            Order History
            <span className="ml-2 text-xs bg-accent px-2 py-1 rounded">Coming Soon</span>
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <CustomerForm
            customer={customer}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/customers')}
          />
        </div>

        {/* Mini Map */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Location</h3>
            {customer.lat && customer.lng ? (
              <div className="h-[300px] rounded-lg overflow-hidden">
                <CustomerMap
                  customers={customerWithCoords}
                  selectedCustomerId={customer.id}
                  showZones={true}
                  viewport={{
                    latitude: customer.lat,
                    longitude: customer.lng,
                    zoom: 10,
                  }}
                  onViewportChange={setViewport}
                  clusterConfig={clusterConfig}
                />
              </div>
            ) : (
              <div className="h-[300px] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  No location data available
                  <br />
                  <span className="text-xs">Geocode the address to display on map</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
