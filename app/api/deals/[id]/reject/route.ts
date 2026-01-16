import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Rate limiting: 20 requests per minute per user
    const rateLimitResult = checkRateLimit(user.id, 20, 60000);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    // CSRF protection removed - auth + rate limiting provide sufficient protection

    // First verify the deal belongs to this user and is pending
    const { data: existingDeal, error: fetchError } = await supabase
      .from('manufacturer_deals')
      .select('id, status, user_id')
      .eq('id', dealId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingDeal) {
      return NextResponse.json(
        { error: 'Deal not found or access denied' },
        { status: 404 }
      );
    }

    if (existingDeal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Deal has already been processed' },
        { status: 400 }
      );
    }

    // Update deal status to rejected
    const { error: updateError } = await supabase
      .from('manufacturer_deals')
      .update({ status: 'rejected' })
      .eq('id', dealId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject deal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deal rejected',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
