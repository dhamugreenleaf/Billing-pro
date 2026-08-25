import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[0-9]+$/, 'Phone number must contain only digits')
  .optional();

export const companySetupSchema = z.object({
  body: z.object({
    company_name: z.string().min(2, 'Company name must be at least 2 characters'),
    owner_name: z.string().optional(),
    phone: phoneSchema,
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gst_number: z.string().optional(),
    invoice_prefix: z.string().optional(),
  })
});
