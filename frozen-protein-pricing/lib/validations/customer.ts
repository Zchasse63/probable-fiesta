import { z } from 'zod';

export const customerSchema = z.object({
  company_name: z
    .string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be 200 characters or less'),
  contact_name: z
    .string()
    .max(100, 'Contact name must be 100 characters or less')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Must be a valid email address')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone must be 20 characters or less')
    .optional()
    .nullable(),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(300, 'Address must be 300 characters or less'),
  city: z
    .string()
    .min(1, 'City is required')
    .max(100, 'City must be 100 characters or less'),
  state: z
    .string()
    .length(2, 'State must be 2 characters (e.g., PA, GA)')
    .toUpperCase(),
  zip_code: z
    .string()
    .min(5, 'ZIP code must be at least 5 characters')
    .max(10, 'ZIP code must be 10 characters or less')
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format'),
  freight_zone_id: z.number().int().positive().optional().nullable(),
});

export const customerUpdateSchema = customerSchema.partial();

export const customerImportSchema = z.object({
  company_name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(2).max(2),
  zip_code: z.string().min(5),
  contact_name: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type CustomerUpdateData = z.infer<typeof customerUpdateSchema>;
export type CustomerImportData = z.infer<typeof customerImportSchema>;
