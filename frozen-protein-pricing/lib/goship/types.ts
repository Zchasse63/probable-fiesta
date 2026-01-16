/**
 * GoShip API TypeScript Definitions
 * Based on GoShip LTL Quote API GraphQL Schema
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type AddressType = 'BUSINESS' | 'RESIDENCE' | 'CONSTRUCTION_SITE' | 'TRADE_SHOW' | 'CHURCH' | 'FARM' | 'GOLF_COURSE' | 'SCHOOL' | 'STORAGE_FACILITY';

export interface RfqEndpointInput {
  postalCode: string;
  addressType?: AddressType;
  city?: string;
  state?: string;
  country?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
}

export type PackagingType = 'PALLET' | 'BAG' | 'BALE' | 'BOX' | 'BUNDLE' | 'CARTON' | 'CASE' | 'COIL' | 'CRATE' | 'CYLINDER' | 'DRUM' | 'PAIL' | 'PIECE' | 'REEL' | 'ROLL' | 'SKID' | 'TOTE';
export type SizeUoM = 'IN' | 'CM';
export type WeightUoM = 'LBS' | 'KG';
export type ItemCondition = 'NEW' | 'USED';

export interface ItemInput {
  quantity: number;
  packaging: PackagingType;
  sizeUoM?: SizeUoM;
  length?: number;
  width?: number;
  height?: number;
  weightUoM: WeightUoM;
  weight: number;
  freightClass?: string;
  value?: number;
  itemCondition?: ItemCondition;
  stackable?: boolean;
  hazardous?: boolean;
  description?: string;
  pieces?: number;
  country?: string;
}

export interface LtlRfqInput {
  origin: RfqEndpointInput;
  destination: RfqEndpointInput;
  pickupDate: string; // ISO 8601 date format YYYY-MM-DD
  items: ItemInput[];
}

export interface LtlCarrier {
  id: string;
  name: string;
  scac?: string;
}

export interface LtlQuote {
  id: string;
  cost: number;
  carrier: LtlCarrier;
  deliveryDate?: string; // ISO 8601 date format
  transitDays?: number;
}

export interface LtlQuoteResponse {
  data?: {
    requestLTLQuote?: LtlQuote;
  };
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
      [key: string]: any;
    };
  }>;
}

export interface GoShipError {
  message: string;
  code?: string;
  statusCode?: number;
}

export class GoShipAPIError extends Error {
  code?: string;
  statusCode?: number;
  graphQLErrors?: Array<{ message: string; code?: string }>;

  constructor(message: string, code?: string, statusCode?: number, graphQLErrors?: any[]) {
    super(message);
    this.name = 'GoShipAPIError';
    this.code = code;
    this.statusCode = statusCode;
    this.graphQLErrors = graphQLErrors;
  }
}
