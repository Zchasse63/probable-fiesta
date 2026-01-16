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
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  const toggleDealSelection = (dealId: string) => {
    setSelectedDeals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleBulkAccept = async () => {
    if (selectedDeals.size === 0) return;
    setIsBulkProcessing(true);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedDeals).map(async (dealId) => {
          const response = await fetch(`/api/deals/${dealId}/accept`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              manufacturer: deals.find(d => d.id === dealId)?.manufacturer || '',
              product_description: deals.find(d => d.id === dealId)?.product_description || '',
              price_per_lb: deals.find(d => d.id === dealId)?.price_per_lb || 0,
              quantity_lbs: deals.find(d => d.id === dealId)?.quantity_lbs || 0,
              pack_size: '1/40lb',
              warehouse_id: 1,
            }),
          });
          if (!response.ok) throw new Error(`Failed to accept deal ${dealId}`);
          return dealId;
        })
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (succeeded > 0) {
        const { toast } = await import('sonner');
        toast.success(`${succeeded} deal(s) accepted successfully`);
      }
      if (failed > 0) {
        const { toast } = await import('sonner');
        toast.error(`${failed} deal(s) failed to accept`);
      }

      setSelectedDeals(new Set());
      await fetchDeals();
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error('Bulk accept failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedDeals.size === 0) return;
    setIsBulkProcessing(true);

    try {
      const results = await Promise.allSettled(
        Array.from(selectedDeals).map(async (dealId) => {
          const response = await fetch(`/api/deals/${dealId}/reject`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error(`Failed to reject deal ${dealId}`);
          return dealId;
        })
      );

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (succeeded > 0) {
        const { toast } = await import('sonner');
        toast.success(`${succeeded} deal(s) rejected successfully`);
      }
      if (failed > 0) {
        const { toast } = await import('sonner');
        toast.error(`${failed} deal(s) failed to reject`);
      }

      setSelectedDeals(new Set());
      await fetchDeals();
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error('Bulk reject failed');
    } finally {
      setIsBulkProcessing(false);
    }
  };

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
      <div className="flex gap-4">
        <Input
          placeholder="Search by manufacturer or product..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        {selectedDeals.size > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkAccept}
              disabled={isBulkProcessing}
            >
              Accept ({selectedDeals.size})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkReject}
              disabled={isBulkProcessing}
            >
              Reject ({selectedDeals.size})
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={filteredDeals.length > 0 && filteredDeals.every(d => selectedDeals.has(d.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedDeals(new Set(filteredDeals.map(d => d.id)));
                    } else {
                      setSelectedDeals(new Set());
                    }
                  }}
                />
              </TableHead>
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
                <TableCell colSpan={8} className="text-center text-muted-foreground">
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDeals.has(deal.id)}
                      onCheckedChange={() => toggleDealSelection(deal.id)}
                    />
                  </TableCell>
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
