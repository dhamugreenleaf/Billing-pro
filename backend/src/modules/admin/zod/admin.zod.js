import { z } from 'zod';

export const updateCustomerStatusSchema = z.object({
  is_active: z.boolean({
    required_error: "Status is required",
    invalid_type_error: "Status must be a boolean",
  }),
});
