'use client';

import { AIUsageStats } from '@/components/settings/ai-usage-stats';

export const dynamic = 'force-dynamic';

export default function AIUsagePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Usage Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor AI feature usage, token consumption, and costs
        </p>
      </div>

      <AIUsageStats />
    </div>
  );
}
