/**
 * GoShip API High-Level Functions
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { createGoShipClient } from './client';
import { LtlRfqInput, LtlQuote, LtlQuoteResponse, GoShipAPIError } from './types';
import { REQUEST_LTL_QUOTE } from './queries';

export interface GetLTLQuoteParams {
  origin: {
    postalCode: string;
    city?: string;
    state?: string;
    addressType?: string;
  };
  destination: {
    postalCode: string;
    city?: string;
    state?: string;
    addressType?: string;
  };
  weight: number; // total weight in lbs
  pallets: number; // number of pallets
  pickupDate: string; // ISO date YYYY-MM-DD
  freightClass?: string; // default "70" for frozen food
}

/**
 * Validate quote parameters
 */
function validateQuoteParams(params: GetLTLQuoteParams): void {
  if (!params.origin?.postalCode) {
    throw new GoShipAPIError('Origin postal code is required', 'VALIDATION_ERROR', 400);
  }

  if (!params.destination?.postalCode) {
    throw new GoShipAPIError('Destination postal code is required', 'VALIDATION_ERROR', 400);
  }

  if (!params.weight || params.weight <= 0) {
    throw new GoShipAPIError('Weight must be greater than 0', 'VALIDATION_ERROR', 400);
  }

  if (!params.pallets || params.pallets <= 0) {
    throw new GoShipAPIError('Pallets must be greater than 0', 'VALIDATION_ERROR', 400);
  }

  if (!params.pickupDate) {
    throw new GoShipAPIError('Pickup date is required', 'VALIDATION_ERROR', 400);
  }

  // Validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(params.pickupDate)) {
    throw new GoShipAPIError('Pickup date must be in YYYY-MM-DD format', 'VALIDATION_ERROR', 400);
  }

  // Validate pickup date is in the future
  const pickupDate = new Date(params.pickupDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (pickupDate < today) {
    throw new GoShipAPIError('Pickup date must be in the future', 'VALIDATION_ERROR', 400);
  }
}

/**
 * Get LTL freight quote from GoShip
 */
export async function getLTLQuote(params: GetLTLQuoteParams): Promise<LtlQuote> {
  // Validate parameters
  validateQuoteParams(params);

  const client = createGoShipClient();

  // Build GraphQL input
  const input: LtlRfqInput = {
    origin: {
      postalCode: params.origin.postalCode,
      city: params.origin.city,
      state: params.origin.state,
      addressType: (params.origin.addressType as any) || 'BUSINESS',
      country: 'US'
    },
    destination: {
      postalCode: params.destination.postalCode,
      city: params.destination.city,
      state: params.destination.state,
      addressType: (params.destination.addressType as any) || 'BUSINESS',
      country: 'US'
    },
    pickupDate: params.pickupDate,
    items: [
      {
        quantity: params.pallets,
        packaging: 'PALLET',
        weight: params.weight,
        weightUoM: 'LBS',
        freightClass: params.freightClass || '70', // Frozen food
        stackable: true,
        hazardous: false,
        itemCondition: 'NEW',
        description: 'Frozen protein products'
      }
    ]
  };

  try {
    const response = await client.query<LtlQuoteResponse>(REQUEST_LTL_QUOTE, input);

    if (!response.data?.requestLTLQuote) {
      throw new GoShipAPIError(
        'No quote returned from GoShip API',
        'NO_QUOTE',
        500
      );
    }

    return response.data.requestLTLQuote;
  } catch (error) {
    if (error instanceof GoShipAPIError) {
      throw error;
    }

    // Wrap unknown errors
    throw new GoShipAPIError(
      `Failed to get LTL quote: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN_ERROR',
      500
    );
  }
}
