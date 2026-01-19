'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Users, Truck, BarChart3 } from 'lucide-react';
import Link from 'next/link';

function ActionButton({ href, icon: Icon, label }: { href: string; icon: typeof Upload; label: string }) {
  return (
    <Link href={href}>
      <button className="flex flex-col items-center gap-2 p-6 rounded-xl border border-border bg-card w-full hover:bg-muted/50 hover:border-primary/20 hover:shadow-sm transition-all group">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </button>
    </Link>
  );
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <ActionButton href="/inventory" icon={Upload} label="Upload Inventory" />
        <ActionButton href="/pricing" icon={FileSpreadsheet} label="New Price Sheet" />
        <ActionButton href="/customers" icon={Users} label="View Customers" />
        <ActionButton href="/freight" icon={Truck} label="Freight Rates" />
        <ActionButton href="/settings/ai-usage" icon={BarChart3} label="AI Usage" />
      </CardContent>
    </Card>
  );
}
