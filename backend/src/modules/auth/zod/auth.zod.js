import { z } from 'zod';

// Resilient mobile number validation (strips non-digits, requires 10-15 digits)
const mobileNumberSchema = z.string()
  .transform(val => val.replace(/[^0-9]/g, ''))
  .refine(val => val.length >= 10 && val.length <= 15, { message: 'Mobile number must be 10-15 digits' });

// Name validation
const nameSchema = z.string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces');

export const verifyMsg91Schema = z.object({
  body: z.object({
    identifier: mobileNumberSchema,
    accessToken: z.string().min(4, 'Invalid OTP or token'),
    name: nameSchema.optional(),
    loginType: z.enum(['admin', 'user']).optional()
  })
});

export const sendOtpSchema = z.object({
  body: z.object({
    identifier: mobileNumberSchema
  })
});

export const resendOtpSchema = z.object({
  body: z.object({
    identifier: mobileNumberSchema
  })
});
