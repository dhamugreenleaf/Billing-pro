import { z } from 'zod';

// Strict mobile number validation (Indian format as example, 10 digits)
const mobileNumberSchema = z.string()
  .min(10, 'Mobile number must be at least 10 digits')
  .max(15, 'Mobile number must not exceed 15 digits')
  .regex(/^[0-9]+$/, 'Mobile number must contain only digits');

// Name validation
const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces');

export const verifyMsg91Schema = z.object({
  body: z.object({
    identifier: mobileNumberSchema,
    accessToken: z.string().min(10, 'Invalid token'),
    name: nameSchema.optional()
  })
});

export const resendOtpSchema = z.object({
  body: z.object({
    identifier: mobileNumberSchema
  })
});
