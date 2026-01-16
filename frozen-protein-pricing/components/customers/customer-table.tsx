'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getZoneColor, getZoneName } from '@/lib/mapbox/zones';
import { useDeleteCustomer } from '@/lib/hooks/use-customers';
import type { Row } from '@/lib/supabase/types';

interface Customer extends Row<'customers'> {
  zones: Row<'zones'> | null;
}

interface CustomerTableProps {
  customers: Customer[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function CustomerTable({
  customers,
  selectedIds,
  onSelectionChange,
}: CustomerTableProps) {
  const router = useRouter();
  const deleteCustomer = useDeleteCustomer();
  const [sortField, setSortField] = useState<'company_name' | 'city' | 'state' | 'zone'>('company_name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'zone':
        aValue = a.zone_id || '';
        bValue = b.zone_id || '';
        break;
      default:
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === customers.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(customers.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteCustomer.mutateAsync(id);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedIds.length === customers.length && customers.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('company_name')}
            >
              Company {sortField === 'company_name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('city')}
            >
              City {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('state')}
            >
              State {sortField === 'state' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('zone')}
            >
              Zone {sortField === 'zone' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contact
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedCustomers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(customer.id)}
                  onChange={() => handleSelectOne(customer.id)}
                  className="rounded border-gray-300"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                {customer.company_name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                {customer.city}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                {customer.state}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {customer.zone_id && (
                  <span
                    className="px-2 py-1 text-xs font-semibold rounded-full text-white"
                    style={{ backgroundColor: getZoneColor(String(customer.zone_id)) }}
                  >
                    {getZoneName(String(customer.zone_id))}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                {customer.customer_type?.replace('_', ' ')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                <div className="text-sm">
                  {customer.contact_name && <div>{customer.contact_name}</div>}
                  {customer.contact_email && (
                    <div className="text-gray-400">{customer.contact_email}</div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  Edit
                </button>
                <button
                  onClick={() => router.push(`/customers/map?selected=${customer.id}`)}
                  className="text-green-600 hover:text-green-900 mr-3"
                >
                  Map
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedCustomers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No customers found
        </div>
      )}
    </div>
  );
}
