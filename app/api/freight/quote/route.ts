/**
 * POST /api/freight/quote
 * Get GoShip LTL quote with reefer estimation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLTLQuote } from '@/lib/goship/api';
import { estimateReeferRate } from '@/lib/utils/freight-calculator';
import { getWarehouseById } from '@/lib/supabase/helpers';
import { GoShipAPIError } from '@/lib/goship/types';

interface QuoteRequest {
  originWarehouseId: number;
  destinationZip: string;
  weight: number;
  pickupDate: string;
  pallets?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: QuoteRequest = await request.json();

    // Validate request body
    if (!body.originWarehouseId) {
      return NextResponse.json(
        { error: 'originWarehouseId is required' },
        { status: 400 }
      );
    }

    if (!body.destinationZip) {
      return NextResponse.json(
        { error: 'destinationZip is required' },
        { status: 400 }
      );
    }

    if (!body.weight || body.weight <= 0) {
      return NextResponse.json(
        { error: 'weight must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.pickupDate) {
      return NextResponse.json(
        { error: 'pickupDate is required (YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Default pallets based on weight (assume ~1875 lbs per pallet)
    const pallets = body.pallets || Math.ceil(body.weight / 1875);

    // Fetch warehouse details using type-safe helper (supabase already initialized above for auth)
    const { data: warehouse, error: warehouseError } = await getWarehouseById(supabase, body.originWarehouseId);

    if (warehouseError || !warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Get GoShip LTL quote
    const ltlQuote = await getLTLQuote({
      origin: {
        postalCode: warehouse.zip,
        city: warehouse.city,
        state: warehouse.state,
        addressType: 'BUSINESS'
      },
      destination: {
        postalCode: body.destinationZip,
        addressType: 'BUSINESS'
      },
      weight: body.weight,
      pallets,
      pickupDate: body.pickupDate
    });

    // Apply reefer estimation
    const shipDate = new Date(body.pickupDate);
    const reeferEstimate = estimateReeferRate(
      ltlQuote.cost,
      warehouse.state,
      shipDate
    );

    return NextResponse.json({
      dryQuote: ltlQuote.cost,
      reeferEstimate: reeferEstimate.estimate,
      rangeLow: reeferEstimate.rangeLow,
      rangeHigh: reeferEstimate.rangeHigh,
      factors: reeferEstimate.factors,
      carrier: ltlQuote.carrier,
      deliveryDate: ltlQuote.deliveryDate,
      transitDays: ltlQuote.transitDays,
      quoteId: ltlQuote.id
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Freight quote error:', error);
    }

    if (error instanceof GoShipAPIError) {
      // Return GoShip API errors as 502 Bad Gateway
      return NextResponse.json(
        {
          error: 'GoShip API error',
          message: error.message,
          code: error.code
        },
        { status: error.statusCode === 400 ? 400 : 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
