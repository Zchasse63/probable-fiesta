import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { geocodeAddress } from '@/lib/mapbox/geocode';
import { getZoneByState } from '@/lib/mapbox/zones';
import { validateCustomer } from '@/lib/validation/customer';

interface ImportCustomer {
  company_name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  customer_type?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

// Mapbox Geocoding API rate limit: 600 requests per minute
// Implementation: Process 10 addresses in parallel, then wait 1 second
// This achieves 10 req/sec = 600 req/min sustained rate
const GEOCODE_BATCH_SIZE = 10;
const GEOCODE_DELAY = 1000; // 1 second delay between batches

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
    const { customers, shouldGeocode } = body as {
      customers: ImportCustomer[];
      shouldGeocode: boolean;
    };

    if (!customers || !Array.isArray(customers)) {
      return NextResponse.json(
        { error: 'Customers array is required' },
        { status: 400 }
      );
    }

    // Enforce maximum batch size for imports
    if (customers.length > 10000) {
      return NextResponse.json(
        { error: 'Import batch too large (max 10000 customers)' },
        { status: 400 }
      );
    }

    const processedCustomers: Array<Record<string, string | number | null | undefined>> = [];
    const failed: Array<{ row: number; error: string }> = [];

    // Process customers in batches if geocoding
    for (let i = 0; i < customers.length; i += shouldGeocode ? GEOCODE_BATCH_SIZE : customers.length) {
      const batch = customers.slice(
        i,
        shouldGeocode ? i + GEOCODE_BATCH_SIZE : customers.length
      );

      const batchResults = await Promise.all(
        batch.map(async (customer, batchIndex) => {
          const rowIndex = i + batchIndex;

          try {
            const processedCustomer: Record<string, string | number | null | undefined> = {
              ...customer,
            };

            // Auto-assign zone by state
            if (customer.state) {
              const zoneId = getZoneByState(customer.state);
              if (zoneId) {
                processedCustomer.zone_id = Number(zoneId);
              }
            }

            // Geocode address if requested and address exists
            if (shouldGeocode && customer.address) {
              try {
                const fullAddress = [
                  customer.address,
                  customer.city,
                  customer.state,
                  customer.zip,
                ]
                  .filter(Boolean)
                  .join(', ');

                const geocoded = await geocodeAddress(fullAddress);

                // Validate geocoding confidence
                if (geocoded.confidence < 0.8) {
                  // REJECT customer with low confidence - do not import without coordinates
                  return {
                    success: false,
                    row: rowIndex + 2,
                    error: `Low geocoding confidence (${geocoded.confidence.toFixed(2)}) for: ${fullAddress}. Manual review required.`,
                  };
                }

                processedCustomer.lat = geocoded.latitude;
                processedCustomer.lng = geocoded.longitude;
              } catch (geocodeError) {
                // REJECT customer on geocoding failure - do not import without coordinates
                return {
                  success: false,
                  row: rowIndex + 2,
                  error: `Geocoding failed: ${geocodeError instanceof Error ? geocodeError.message : 'Unknown error'}`,
                };
              }
            } else if (shouldGeocode && !customer.address) {
              // REJECT customer if geocoding requested but no address provided
              return {
                success: false,
                row: rowIndex + 2,
                error: 'Address required for geocoding',
              };
            }

            return { success: true, customer: processedCustomer };
          } catch (error) {
            return {
              success: false,
              row: rowIndex + 2,
              error: error instanceof Error ? error.message : 'Unknown error',
            };
          }
        })
      );

      // Separate successful and failed
      batchResults.forEach((result) => {
        if (result.success && result.customer) {
          processedCustomers.push(result.customer);
        } else if (!result.success && result.row !== undefined && result.error !== undefined) {
          failed.push({ row: result.row, error: result.error });
        }
      });

      // Delay between batches if geocoding
      if (shouldGeocode && i + GEOCODE_BATCH_SIZE < customers.length) {
        await delay(GEOCODE_DELAY);
      }
    }

    // Validate and filter processedCustomers before bulk insert
    const validatedCustomers = [];
    for (let i = 0; i < processedCustomers.length; i++) {
      const validation = validateCustomer(processedCustomers[i]);
      if (validation.valid) {
        validatedCustomers.push(processedCustomers[i]);
      } else {
        // Add validation errors to failed array
        failed.push({
          row: i + 2, // Row number in spreadsheet (1-indexed + header)
          error: `Validation failed: ${validation.errors.join(', ')}`
        });
      }
    }

    // Bulk insert valid customers
    if (validatedCustomers.length > 0) {
      const { error: insertError } = await supabase
        .from('customers')
        .insert(validatedCustomers);

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to insert customers: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      imported: validatedCustomers.length,
      failed,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
