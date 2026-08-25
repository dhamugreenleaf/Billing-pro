import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'Mobile number must be at least 10 digits')
  .max(15, 'Mobile number must not exceed 15 digits')
  .regex(/^[0-9]+$/, 'Mobile number must contain only digits');

export const createCustomerSchema = z.object({
  body: z.object({
    mobile_number: phoneSchema,
    name: z.string().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    address: z.string().optional().or(z.literal('')),
  })
});
