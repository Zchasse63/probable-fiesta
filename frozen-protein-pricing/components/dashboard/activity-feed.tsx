'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileSpreadsheet, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'upload' | 'price_sheet' | 'deal_accepted' | 'deal_rejected' | 'product_update';
  description: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const iconMap = {
  upload: Upload,
  price_sheet: FileSpreadsheet,
  deal_accepted: CheckCircle,
  deal_rejected: XCircle,
  product_update: Package,
};

const colorMap = {
  upload: 'text-primary',
  price_sheet: 'text-green-500',
  deal_accepted: 'text-green-600',
  deal_rejected: 'text-destructive',
  product_update: 'text-purple-500',
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground">Your recent actions will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = iconMap[activity.type];
            const colorClass = colorMap[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
