'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  href?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  trendValue,
  href,
}: StatsCardProps) {
  const content = (
    <Card className={cn(href && 'hover:shadow-md transition-shadow cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-1">
            {trend && (
              <span
                className={cn(
                  'flex items-center text-xs font-medium',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-destructive',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' && <TrendingUp className="h-3 w-3 mr-0.5" />}
                {trend === 'down' && <TrendingDown className="h-3 w-3 mr-0.5" />}
                {trend === 'neutral' && <Minus className="h-3 w-3 mr-0.5" />}
                {trendValue}
              </span>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
