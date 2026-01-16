'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DealParser } from '@/components/deals/deal-parser';
import { DealReview } from '@/components/deals/deal-review';
import { DealTable } from '@/components/deals/deal-table';
import { createClient } from '@/lib/supabase/client';

interface ParsedDeal {
  manufacturer: string;
  product_description: string;
  price_per_lb: number;
  quantity_lbs: number;
  pack_size: string;
  expiration_date?: string;
  deal_terms?: string;
}

interface Warehouse {
  id: number;
  name: string;
}

export default function DealsPage() {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [selectedDealData, setSelectedDealData] = useState<ParsedDeal | null>(null);
  const [activeTab, setActiveTab] = useState('parse');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('warehouses')
        .select('id, name')
        .order('name');
      if (data) {
        setWarehouses(data);
      }
    };
    fetchWarehouses();
  }, []);

  const handleDealParsed = (deal: ParsedDeal, dealId: string) => {
    setSelectedDealId(dealId);
    setSelectedDealData(deal);
    setActiveTab('review');
  };

  const handleDealAction = () => {
    // Refresh the table after accepting/rejecting
    setActiveTab('pending');
    setSelectedDealId(null);
    setSelectedDealData(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Deal Inbox</h1>
        <p className="text-muted-foreground">
          Parse manufacturer deal emails and manage incoming deals
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="parse">Parse New</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="parse" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DealParser onDealParsed={handleDealParsed} />
            {selectedDealData && selectedDealId && (
              <DealReview
                dealId={selectedDealId}
                initialData={selectedDealData}
                warehouses={warehouses}
                onAccept={handleDealAction}
                onReject={handleDealAction}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <DealTable statusFilter="pending" />
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          <DealTable statusFilter="accepted" />
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <DealTable statusFilter="rejected" />
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          {selectedDealData && selectedDealId && (
            <DealReview
              dealId={selectedDealId}
              initialData={selectedDealData}
              warehouses={warehouses}
              onAccept={handleDealAction}
              onReject={handleDealAction}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
