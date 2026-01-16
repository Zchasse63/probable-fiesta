/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * POST /api/freight/calibrate
 * Calibrate freight rates for all warehouse-zone pairs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLTLQuote } from '@/lib/goship/api';
import { estimateReeferRate, calculateFreightPerLb } from '@/lib/utils/freight-calculator';
import { getActiveWarehouses, upsertFreightRate } from '@/lib/supabase/helpers';

// Key destination cities per zone for calibration
const ZONE_DESTINATIONS: Record<number, Array<{ city: string; state: string; zip: string }>> = {
  1: [ // Southeast
    { city: 'Miami', state: 'FL', zip: '33101' },
    { city: 'Atlanta', state: 'GA', zip: '30303' },
    { city: 'Charlotte', state: 'NC', zip: '28202' },
    { city: 'Nashville', state: 'TN', zip: '37203' },
    { city: 'Columbia', state: 'SC', zip: '29201' }
  ],
  2: [ // Northeast
    { city: 'New York', state: 'NY', zip: '10001' },
    { city: 'Philadelphia', state: 'PA', zip: '19102' },
    { city: 'Boston', state: 'MA', zip: '02108' },
    { city: 'Baltimore', state: 'MD', zip: '21201' },
    { city: 'Newark', state: 'NJ', zip: '07102' }
  ],
  3: [ // Midwest
    { city: 'Chicago', state: 'IL', zip: '60601' },
    { city: 'Detroit', state: 'MI', zip: '48226' },
    { city: 'Cleveland', state: 'OH', zip: '44113' },
    { city: 'Indianapolis', state: 'IN', zip: '46204' },
    { city: 'Columbus', state: 'OH', zip: '43215' }
  ],
  4: [ // West
    { city: 'Los Angeles', state: 'CA', zip: '90012' },
    { city: 'San Francisco', state: 'CA', zip: '94102' },
    { city: 'Phoenix', state: 'AZ', zip: '85003' },
    { city: 'Denver', state: 'CO', zip: '80202' },
    { city: 'Seattle', state: 'WA', zip: '98101' }
  ]
};

const DEFAULT_WEIGHT = 7500; // Standard calibration weight
const DEFAULT_PALLETS = 4;
const CACHE_TTL_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all active warehouses using type-safe helper
    const { data: warehouses, error: warehouseError } = await getActiveWarehouses(supabase);

    if (warehouseError) {
      throw warehouseError;
    }

    if (!warehouses || warehouses.length === 0) {
      return NextResponse.json(
        { error: 'No active warehouses found' },
        { status: 404 }
      );
    }

    // Calculate pickup date (tomorrow to ensure future date)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const results: any[] = [];
    let calibratedCount = 0;
    const errors: any[] = [];

    // For each warehouse
    for (const warehouse of warehouses) {
      // Get zones this warehouse serves
      const servedZones = warehouse.serves_zones || [];

      // For each served zone
      for (const zoneId of servedZones) {
        const destinations = ZONE_DESTINATIONS[zoneId] || [];

        // For each destination in the zone
        for (const destination of destinations) {
          try {
            // Get LTL quote
            const ltlQuote = await getLTLQuote({
              origin: {
                postalCode: warehouse.zip,
                city: warehouse.city,
                state: warehouse.state,
                addressType: 'BUSINESS'
              },
              destination: {
                postalCode: destination.zip,
                city: destination.city,
                state: destination.state,
                addressType: 'BUSINESS'
              },
              weight: DEFAULT_WEIGHT,
              pallets: DEFAULT_PALLETS,
              pickupDate
            });

            // Apply reefer estimation
            const reeferEstimate = estimateReeferRate(
              ltlQuote.cost,
              warehouse.state,
              tomorrow
            );

            // Calculate rate per lb
            const ratePerLb = calculateFreightPerLb(reeferEstimate.estimate, DEFAULT_WEIGHT);

            // Calculate valid_until (7 days from now)
            const validUntil = new Date();
            validUntil.setDate(validUntil.getDate() + CACHE_TTL_DAYS);

            // Upsert freight_rates using type-safe helper
            const { error: insertError } = await upsertFreightRate(supabase, {
              origin_warehouse_id: warehouse.id,
              destination_zone_id: zoneId,
              city: destination.city,
              state: destination.state,
              rate_per_lb: ratePerLb,
              rate_type: 'frozen_ltl',
              weight_lbs: DEFAULT_WEIGHT,
              dry_ltl_quote: ltlQuote.cost,
              multipliers: {
                base: reeferEstimate.factors.base,
                origin: reeferEstimate.factors.origin,
                season: reeferEstimate.factors.season,
                estimate: reeferEstimate.estimate
              },
              valid_from: new Date().toISOString(),
              valid_until: validUntil.toISOString(),
              goship_quote_id: ltlQuote.id
            });

            if (insertError) {
              throw insertError;
            }

            calibratedCount++;
            results.push({
              warehouse: warehouse.code,
              zone: zoneId,
              destination: `${destination.city}, ${destination.state}`,
              dryQuote: ltlQuote.cost,
              reeferEstimate: reeferEstimate.estimate,
              ratePerLb
            });

          } catch (error) {
            if (process.env.NODE_ENV === 'development') {
              console.error(`Error calibrating ${warehouse.code} -> ${destination.city}:`, error);
            }
            errors.push({
              warehouse: warehouse.code,
              destination: `${destination.city}, ${destination.state}`,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }
    }

    return NextResponse.json({
      calibrated: calibratedCount,
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Calibration error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
