'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Users, Truck, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Link href="/inventory">
          <Button variant="outline" className="h-20 flex-col w-full">
            <Upload className="h-5 w-5 mb-1" />
            <span className="text-xs">Upload Inventory</span>
          </Button>
        </Link>
        <Link href="/pricing">
          <Button variant="outline" className="h-20 flex-col w-full">
            <FileSpreadsheet className="h-5 w-5 mb-1" />
            <span className="text-xs">New Price Sheet</span>
          </Button>
        </Link>
        <Link href="/customers">
          <Button variant="outline" className="h-20 flex-col w-full">
            <Users className="h-5 w-5 mb-1" />
            <span className="text-xs">View Customers</span>
          </Button>
        </Link>
        <Link href="/freight">
          <Button variant="outline" className="h-20 flex-col w-full">
            <Truck className="h-5 w-5 mb-1" />
            <span className="text-xs">Freight Rates</span>
          </Button>
        </Link>
        <Link href="/settings/ai-usage">
          <Button variant="outline" className="h-20 flex-col w-full">
            <BarChart3 className="h-5 w-5 mb-1" />
            <span className="text-xs">AI Usage</span>
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
