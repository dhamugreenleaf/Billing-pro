import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[0-9+]+$/, 'Phone number must contain only digits')
  .optional()
  .or(z.literal(''))
  .nullable();

export const companySetupSchema = z.object({
  body: z.object({
    company_name: z.string().min(2, 'Company name must be at least 2 characters'),
    owner_name: z.string().optional().or(z.literal('')).nullable(),
    phone: phoneSchema,
    email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
    address: z.string().optional().or(z.literal('')).nullable(),
    address_line_2: z.string().optional().or(z.literal('')).nullable(),
    city: z.string().optional().or(z.literal('')).nullable(),
    state: z.string().optional().or(z.literal('')).nullable(),
    pincode: z.string().optional().or(z.literal('')).nullable(),
    country: z.string().optional().or(z.literal('')).nullable(),
    gst_number: z.string().optional().or(z.literal('')).nullable(),
    pan: z.string().optional().or(z.literal('')).nullable(),
    registrationType: z.string().optional().or(z.literal('')).nullable(),
    business_type: z.string().optional().or(z.literal('')).nullable(),
    website: z.string().optional().or(z.literal('')).nullable(),
    additionalPhone: z.string().optional().or(z.literal('')).nullable(),
    description: z.string().optional().or(z.literal('')).nullable(),
    logo: z.string().optional().or(z.literal('')).nullable(),
    invoice_prefix: z.string().optional().or(z.literal('')).nullable(),
  })
});
