'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CustomerForm } from '@/components/customers/customer-form';
import { useCreateCustomer } from '@/lib/hooks/use-customers';
import type { Insert } from '@/lib/supabase/types';

export default function NewCustomerPage() {
  const router = useRouter();
  const createCustomer = useCreateCustomer();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (customer: Partial<Insert<'customers'>>) => {
    setIsSubmitting(true);
    try {
      await createCustomer.mutateAsync(customer as Insert<'customers'>);
      router.push('/customers');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/customers');
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Customer</h1>
        <p className="text-muted-foreground mt-1">
          Create a new customer record with address and zone information
        </p>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <CustomerForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
