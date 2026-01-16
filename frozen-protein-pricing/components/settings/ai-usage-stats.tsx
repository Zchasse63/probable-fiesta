'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { startOfMonth, endOfMonth, subDays } from 'date-fns';

interface UsageStats {
  totalTokens: number;
  totalCost: number;
  successRate: number;
  byTaskType: Array<{
    task_type: string;
    total_tokens: number;
    cost: number;
    count: number;
  }>;
}

export function AIUsageStats() {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');
  const supabase = createClient();

  const fetchUsageStats = useCallback(async () => {
    setIsLoading(true);

    try {
      let query = supabase.from('ai_processing_log').select('*');

      // Apply date filter
      if (dateRange === '7d') {
        const startDate = subDays(new Date(), 7).toISOString();
        query = query.gte('created_at', startDate);
      } else if (dateRange === '30d') {
        const startDate = subDays(new Date(), 30).toISOString();
        query = query.gte('created_at', startDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats({
          totalTokens: 0,
          totalCost: 0,
          successRate: 0,
          byTaskType: [],
        });
        return;
      }

      // Calculate stats
      const totalTokens = data.reduce(
        (sum, log) => sum + (log.tokens_in || 0) + (log.tokens_out || 0),
        0
      );
      const totalCost = data.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
      const successCount = data.filter((log) => log.success).length;
      const successRate = (successCount / data.length) * 100;

      // Group by task type
      const taskTypeMap = new Map<
        string,
        { tokens: number; cost: number; count: number }
      >();

      data.forEach((log) => {
        const taskType = log.task_type || 'unknown';
        const existing = taskTypeMap.get(taskType) || {
          tokens: 0,
          cost: 0,
          count: 0,
        };

        taskTypeMap.set(taskType, {
          tokens:
            existing.tokens + (log.tokens_in || 0) + (log.tokens_out || 0),
          cost: existing.cost + (log.cost_usd || 0),
          count: existing.count + 1,
        });
      });

      const byTaskType = Array.from(taskTypeMap.entries())
        .map(([task_type, data]) => ({
          task_type,
          total_tokens: data.tokens,
          cost: data.cost,
          count: data.count,
        }))
        .sort((a, b) => b.cost - a.cost);

      setStats({
        totalTokens,
        totalCost,
        successRate,
        byTaskType,
      });
    } catch (error) {
      // Silent failure - stats display will show "No usage data available"
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, supabase]);

  useEffect(() => {
    fetchUsageStats();
  }, [fetchUsageStats]);

  if (isLoading) {
    return <div className="text-center py-8">Loading usage statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No usage data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setDateRange('7d')}
          className={`px-3 py-1 rounded ${dateRange === '7d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setDateRange('30d')}
          className={`px-3 py-1 rounded ${dateRange === '30d' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          Last 30 days
        </button>
        <button
          onClick={() => setDateRange('all')}
          className={`px-3 py-1 rounded ${dateRange === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
        >
          All time
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${stats.totalCost.toFixed(4)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage by Task Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.byTaskType.map((item) => (
              <div
                key={item.task_type}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{item.task_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.count} calls · {item.total_tokens.toLocaleString()} tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${item.cost.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
