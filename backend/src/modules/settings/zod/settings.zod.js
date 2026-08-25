import { z } from 'zod';

export const updateSettingsSchema = z.object({
  body: z.object({
    default_invoice_template: z.string().optional(),
    default_payment_method: z.string().optional(),
    currency: z.string().length(3).optional(),
    default_gst_rate: z.number().optional(),
    business_settings: z.record(z.any()).optional(),
    notification_settings: z.record(z.any()).optional(),
  })
});
