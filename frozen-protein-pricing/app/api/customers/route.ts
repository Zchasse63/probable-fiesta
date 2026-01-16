import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateCustomer } from '@/lib/validation/customer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const zoneId = searchParams.get('zone_id');
    const state = searchParams.get('state');
    const customerType = searchParams.get('customer_type');
    const search = searchParams.get('search');

    // Validate and enforce pagination limits
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50));
    const offset = (page - 1) * limit;

    // Validate search parameter length
    if (search && search.length > 100) {
      return NextResponse.json(
        { error: 'Search query too long (max 100 characters)' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('customers')
      .select('*, zones(*)', { count: 'exact' });

    // Apply filters
    if (zoneId) {
      query = query.eq('zone_id', zoneId);
    }
    if (state) {
      query = query.eq('state', state);
    }
    if (customerType) {
      query = query.eq('customer_type', customerType);
    }
    if (search) {
      // Sanitize search input for ILIKE query
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&');
      query = query.ilike('company_name', `%${sanitizedSearch}%`);
    }

    // Apply pagination
    query = query
      .order('company_name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch customers: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Auto-assign zone based on state if not already set
    if (body.state && !body.zone_id) {
      // Import zone lookup function
      const { getZoneByState } = await import('@/lib/mapbox/zones');
      const assignedZoneId = getZoneByState(body.state);
      if (assignedZoneId) {
        const parsedZoneId = parseInt(assignedZoneId, 10);
        if (isNaN(parsedZoneId)) {
          return NextResponse.json(
            { error: 'Invalid zone assignment' },
            { status: 500 }
          );
        }
        body.zone_id = parsedZoneId;
      }
    }

    // Validate customer data
    const validation = validateCustomer(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Whitelist allowed fields
    const allowedFields = [
      'company_name', 'address', 'city', 'state', 'zip',
      'lat', 'lng', 'zone_id', 'customer_type',
      'contact_name', 'contact_email', 'contact_phone', 'notes'
    ];
    const sanitizedBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key))
    );

    const { data, error } = await supabase
      .from('customers')
      .insert(sanitizedBody)
      .select('*, zones(*)')
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to create customer: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
