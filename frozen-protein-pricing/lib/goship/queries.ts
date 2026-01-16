/**
 * GoShip API GraphQL Queries
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const REQUEST_LTL_QUOTE = `
  mutation RequestLTLQuote($input: LtlRfqInput!) {
    requestLTLQuote(input: $input) {
      id
      cost
      carrier {
        id
        name
        scac
      }
      deliveryDate
      transitDays
    }
  }
`;

/**
 * Build GraphQL request body
 */
export function buildLTLQuoteRequest(variables: any) {
  return {
    query: REQUEST_LTL_QUOTE,
    variables: {
      input: variables
    }
  };
}
