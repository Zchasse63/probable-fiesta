import { z } from 'zod';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
];

export const fileUploadSchema = z.object({
  file: z
    .custom<File>()
    .refine((file) => file instanceof File, 'Please select a file')
    .refine((file) => file.size <= MAX_FILE_SIZE, 'File size must be less than 10MB')
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'File must be .xlsx, .xls, or .csv'
    ),
  warehouse_id: z.number().int().positive('Warehouse is required'),
});

export const inventoryRowSchema = z.object({
  item_code: z.string().min(1, 'Item code is required'),
  description: z.string().min(1, 'Description is required'),
  pack_size: z.string().min(1, 'Pack size is required'),
  brand: z.string().optional().nullable(),
  price_per_lb: z
    .number()
    .min(0.01, 'Price must be greater than 0')
    .max(10000, 'Price must be less than $10,000'),
  in_stock: z.boolean().optional().default(true),
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type InventoryRowData = z.infer<typeof inventoryRowSchema>;
