import { Package, DollarSign, Users, Truck, Archive, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatsCard } from '@/components/dashboard/stats-card';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getDashboardStats() {
  const supabase = await createClient();

  // Fetch stats in parallel
  const [
    productsResult,
    productsByCategoryResult,
    productsByWarehouseResult,
    priceSheetsResult,
    customersResult,
    freightRatesResult,
    pendingDealsResult,
  ] = await Promise.all([
    // Total products
    supabase.from('products').select('id', { count: 'exact', head: true }),
    // Products by category (approximated by brand grouping)
    supabase.from('products').select('brand'),
    // Products by warehouse
    supabase.from('products').select('warehouse_id'),
    // Price sheets this week
    supabase
      .from('price_sheets')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // Active customers
    supabase.from('customers').select('id, freight_zone_id', { count: 'exact' }),
    // Freight rates (check if any exist within last 30 days)
    supabase
      .from('freight_rates')
      .select('id', { count: 'exact', head: true })
      .gte('fetched_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    // Pending deals
    supabase
      .from('manufacturer_deals')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ]);

  const totalProducts = productsResult.count || 0;
  const priceSheetsThisWeek = priceSheetsResult.count || 0;
  const totalCustomers = customersResult.count || 0;
  const freshRatesCount = freightRatesResult.count || 0;
  const pendingDealsCount = pendingDealsResult.count || 0;

  // Count unique categories (brands)
  const categories = new Set(
    (productsByCategoryResult.data || []).map((p) => p.brand).filter(Boolean)
  );

  // Count products by warehouse
  const warehouseCounts: Record<string, number> = {};
  (productsByWarehouseResult.data || []).forEach((p) => {
    const wh = p.warehouse_id || 'unknown';
    warehouseCounts[wh] = (warehouseCounts[wh] || 0) + 1;
  });

  // Count customers by zone
  const zoneCounts: Record<string, number> = {};
  (customersResult.data || []).forEach((c) => {
    const zone = c.freight_zone_id || 'unassigned';
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });

  return {
    totalProducts,
    categoryCount: categories.size,
    warehouseCounts,
    priceSheetsThisWeek,
    totalCustomers,
    zoneCounts,
    freightRatesStatus: freshRatesCount > 0 ? 'calibrated' : 'not_calibrated',
    freshRatesCount,
    pendingDealsCount,
  };
}

async function getRecentActivity() {
  const supabase = await createClient();

  // Get recent price sheets
  const { data: priceSheets } = await supabase
    .from('price_sheets')
    .select('id, created_at, freight_zones(zone_name)')
    .order('created_at', { ascending: false })
    .limit(3);

  // Get recent deal actions
  const { data: deals } = await supabase
    .from('manufacturer_deals')
    .select('id, status, manufacturer, updated_at')
    .in('status', ['accepted', 'rejected'])
    .order('updated_at', { ascending: false })
    .limit(3);

  interface FreightZone {
    zone_name?: string;
  }

  const activities = [
    ...(priceSheets || []).map((ps) => ({
      id: `ps-${ps.id}`,
      type: 'price_sheet' as const,
      description: `Price sheet generated for ${(ps.freight_zones as FreightZone)?.zone_name || 'Unknown Zone'}`,
      timestamp: ps.created_at,
    })),
    ...(deals || []).map((d) => ({
      id: `deal-${d.id}`,
      type: d.status === 'accepted' ? ('deal_accepted' as const) : ('deal_rejected' as const),
      description: `Deal from ${d.manufacturer} ${d.status}`,
      timestamp: d.updated_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return activities;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const activities = await getRecentActivity();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the Frozen Protein Pricing Platform
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          description={`${stats.categoryCount} categories`}
          href="/inventory"
        />
        <StatsCard
          title="Price Sheets"
          value={stats.priceSheetsThisWeek}
          icon={DollarSign}
          description="Generated this week"
          href="/pricing"
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers.toLocaleString()}
          icon={Users}
          description="Food distributors"
          href="/customers"
        />
        <StatsCard
          title="Freight Rates"
          value={stats.freightRatesStatus === 'calibrated' ? 'Calibrated' : 'Not Calibrated'}
          icon={Truck}
          description={
            stats.freightRatesStatus === 'calibrated'
              ? `${stats.freshRatesCount} fresh rates`
              : 'Click to calibrate'
          }
          href="/freight"
        />
      </div>

      {/* Pending Deals Alert */}
      {stats.pendingDealsCount > 0 && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <div>
              <p className="font-medium text-warning-800">
                {stats.pendingDealsCount} pending deal{stats.pendingDealsCount !== 1 ? 's' : ''} awaiting review
              </p>
              <a href="/deals" className="text-sm text-warning-700 hover:underline">
                Review deals
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions and Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <QuickActions />
        <ActivityFeed activities={activities} />
      </div>

      {/* Warehouse Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Warehouse Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Pennsylvania Warehouse</p>
              <p className="text-sm text-muted-foreground">Boyertown, PA 19512</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.warehouseCounts['1'] || 0} products
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-foreground">Georgia Warehouse</p>
              <p className="text-sm text-muted-foreground">Americus, GA 31709</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.warehouseCounts['2'] || 0} products
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
