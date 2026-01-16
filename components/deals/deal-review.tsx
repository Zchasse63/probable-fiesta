'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Warehouse {
  id: number;
  name: string;
}

interface DealReviewProps {
  dealId: string;
  initialData: {
    manufacturer: string;
    product_description: string;
    price_per_lb: number;
    quantity_lbs: number;
    pack_size: string;
    expiration_date?: string;
    deal_terms?: string;
  };
  warehouses: Warehouse[];
  onAccept?: () => void;
  onReject?: () => void;
}

export function DealReview({
  dealId,
  initialData,
  warehouses,
  onAccept,
  onReject,
}: DealReviewProps) {
  const [formData, setFormData] = useState(initialData);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleAccept = async () => {
    if (!warehouseId) {
      toast({
        title: 'Missing Warehouse',
        description: 'Please select a warehouse for this product',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/deals/${dealId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ ...formData, warehouse_id: warehouseId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept deal');
      }

      if (data.warning) {
        toast({
          title: 'Deal Accepted with Warning',
          description: data.warning,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Deal Accepted',
          description: data.message || 'Deal has been accepted and product created',
        });
      }

      onAccept?.();
    } catch (error: unknown) {
      toast({
        title: 'Accept Failed',
        description: error instanceof Error ? error.message : 'Failed to accept deal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/deals/${dealId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject deal');
      }

      toast({
        title: 'Deal Rejected',
        description: data.message || 'Deal has been archived',
      });

      onReject?.();
    } catch (error: unknown) {
      toast({
        title: 'Reject Failed',
        description: error instanceof Error ? error.message : 'Failed to reject deal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Review Deal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pack_size">Pack Size</Label>
            <Input
              id="pack_size"
              value={formData.pack_size}
              onChange={(e) =>
                setFormData({ ...formData, pack_size: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              value={formData.product_description}
              onChange={(e) =>
                setFormData({ ...formData, product_description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per lb ($)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price_per_lb}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({
                  ...formData,
                  price_per_lb: Number.isFinite(value) && value >= 0 ? value : 0,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (lbs)</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity_lbs}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData({
                  ...formData,
                  quantity_lbs: Number.isFinite(value) && value >= 0 ? value : 0,
                });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration Date</Label>
            <Input
              id="expiration"
              type="date"
              value={formData.expiration_date || ''}
              onChange={(e) =>
                setFormData({ ...formData, expiration_date: e.target.value })
              }
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="terms">Deal Terms</Label>
            <Textarea
              id="terms"
              value={formData.deal_terms || ''}
              onChange={(e) =>
                setFormData({ ...formData, deal_terms: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="warehouse">Warehouse (Required)</Label>
            <select
              id="warehouse"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={warehouseId || ''}
              onChange={(e) => setWarehouseId(e.target.value ? parseInt(e.target.value, 10) : null)}
              required
            >
              <option value="">Select a warehouse...</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Reject Deal
          </Button>
          <Button onClick={handleAccept} disabled={isSubmitting}>
            <Check className="mr-2 h-4 w-4" />
            Accept Deal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
