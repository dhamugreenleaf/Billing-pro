import { z } from 'zod';

const phoneSchema = z.string()
  .min(10, 'Mobile number must be at least 10 digits')
  .max(15, 'Mobile number must not exceed 15 digits')
  .regex(/^[0-9]+$/, 'Mobile number must contain only digits');

const invoiceItemSchema = z.object({
  item_name: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(0.01).optional().default(1),
  unit_price: z.number().min(0),
  discount: z.number().min(0).optional().default(0),
  tax_percentage: z.number().min(0).max(100).optional().default(0),
});

export const createInvoiceSchema = z.object({
  body: z.object({
    customer_mobile: phoneSchema,
    customer_name: z.string().min(1, 'Customer name is required'),
    billing_address: z.string().min(1, 'Billing address is required'),
    shipping_address: z.string().min(1, 'Shipping address is required'),
    description: z.string().optional(),
    amount: z.number().min(0, 'Amount must be greater than or equal to 0').optional(),
    
    // Optional advanced fields
    items: z.array(invoiceItemSchema).optional(),
    discount: z.number().min(0).optional().default(0),
    gst_enabled: z.boolean().optional().default(false),
    gst_rate: z.number().min(0).max(100).optional().default(0),
    gst_price_type: z.enum(['exclusive', 'inclusive']).optional().default('exclusive'),
    place_of_supply: z.string().optional(),
    payment_method: z.string().optional().default('cash'),
    invoice_template: z.string().optional().default('normal'),
    notes: z.string().optional(),
  })
});
