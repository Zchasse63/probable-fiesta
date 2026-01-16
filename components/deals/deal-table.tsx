'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table-shadcn';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Deal {
  id: string;
  created_at: string;
  manufacturer: string;
  product_description: string;
  price_per_lb: number;
  quantity_lbs: number;
  status: 'pending' | 'accepted' | 'rejected';
}

interface DealTableProps {
  statusFilter?: 'pending' | 'accepted' | 'rejected' | 'all';
  onDealClick?: (dealId: string) => void;
}

export function DealTable({ statusFilter = 'all', onDealClick }: DealTableProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from('manufacturer_deals')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      setDeals([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const filteredDeals = deals.filter(
    (deal) =>
      deal.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.product_description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-600">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading deals...</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by manufacturer or product..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Manufacturer</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Price/lb</TableHead>
              <TableHead className="text-right">Quantity (lbs)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No deals found
                </TableCell>
              </TableRow>
            ) : (
              filteredDeals.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onDealClick?.(deal.id)}
                >
                  <TableCell>
                    {format(new Date(deal.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {deal.manufacturer}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {deal.product_description}
                  </TableCell>
                  <TableCell className="text-right">
                    ${deal.price_per_lb.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {deal.quantity_lbs.toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(deal.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDealClick?.(deal.id);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
