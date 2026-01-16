import { z } from 'zod';

export const marginSchema = z.object({
  margin_percent: z
    .number()
    .min(0, 'Margin cannot be negative')
    .max(100, 'Margin cannot exceed 100%'),
});

export const priceOverrideSchema = z.object({
  price_per_lb: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price must be less than $10,000'),
});

export const freightOverrideSchema = z.object({
  freight_per_lb: z
    .number()
    .min(0, 'Freight cannot be negative')
    .max(100, 'Freight must be less than $100/lb'),
});

export const priceSheetCreateSchema = z.object({
  freight_zone_id: z.number().int().positive('Zone is required'),
  base_margin_percent: z
    .number()
    .min(0, 'Margin cannot be negative')
    .max(100, 'Margin cannot exceed 100%')
    .default(15),
  freight_per_lb: z
    .number()
    .min(0, 'Freight cannot be negative')
    .max(100, 'Freight must be less than $100/lb')
    .optional()
    .nullable(),
});

export type MarginFormData = z.infer<typeof marginSchema>;
export type PriceOverrideData = z.infer<typeof priceOverrideSchema>;
export type FreightOverrideData = z.infer<typeof freightOverrideSchema>;
export type PriceSheetCreateData = z.infer<typeof priceSheetCreateSchema>;
