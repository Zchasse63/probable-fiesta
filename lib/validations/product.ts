import { z } from 'zod';

export const productSchema = z.object({
  item_code: z
    .string()
    .min(1, 'Item code is required')
    .max(50, 'Item code must be 50 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less'),
  pack_size: z
    .string()
    .min(1, 'Pack size is required')
    .max(100, 'Pack size must be 100 characters or less'),
  brand: z
    .string()
    .max(100, 'Brand must be 100 characters or less')
    .optional()
    .nullable(),
  base_price_per_lb: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price must be less than $10,000'),
  warehouse_id: z.number().int().positive('Warehouse is required'),
  in_stock: z.boolean().default(true),
  spec_sheet_url: z
    .string()
    .url('Must be a valid URL')
    .startsWith('https://', 'URL must use HTTPS')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const productUpdateSchema = productSchema.partial();

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductUpdateData = z.infer<typeof productUpdateSchema>;
