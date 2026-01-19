'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  DollarSign,
  Users,
  Truck,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const iconMap: Record<string, LucideIcon> = {
  package: Package,
  'dollar-sign': DollarSign,
  users: Users,
  truck: Truck,
};

interface StatsCardProps {
  title: string;
  value: string | number;
  iconName: string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  href?: string;
}

export function StatsCard({
  title,
  value,
  iconName,
  description,
  trend,
  trendValue,
  href,
}: StatsCardProps) {
  const Icon = iconMap[iconName] || Package;
  const content = (
    <Card className={cn(href && 'hover:shadow-md hover:border-primary/20 cursor-pointer')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight mt-1">{value}</p>
            {(description || trend) && (
              <div className="flex items-center gap-2 mt-1">
                {trend && (
                  <span
                    className={cn(
                      'flex items-center text-xs font-medium',
                      trend === 'up' && 'text-success',
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
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
