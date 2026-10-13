import * as paymentService from '../services/payment.service.js';
import { sendSuccess } from '../../../utils/response.js';
import { z } from 'zod';

const recordPaymentSchema = z.object({
  amount: z.number({ required_error: 'amount is required' }).positive('amount must be positive'),
  payment_method: z.string({ required_error: 'payment_method is required' }).min(1),
  payment_reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * POST /api/invoices/:id/payment
 *
 * Records a payment against an invoice.
 * The authenticated user's company is resolved server-side (never trusted from body/params).
 */
export const recordPayment = async (req, res, next) => {
  try {
    const invoiceId = req.params.id;
    const parsed = recordPaymentSchema.parse(req.body);

    const result = await paymentService.recordPayment(req.user.id, invoiceId, parsed);

    if (result.idempotent) {
      return sendSuccess(res, 'Payment already recorded (idempotent)', {
        invoice: result.invoice,
        payment: result.payment,
        idempotent: true,
      });
    }

    return sendSuccess(res, 'Payment recorded successfully', {
      invoice: result.invoice,
      payment: result.payment,
      idempotent: false,
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/invoices/:id/payments
 *
 * Returns all payment records for an invoice.
 */
export const getInvoicePayments = async (req, res, next) => {
  try {
    const result = await paymentService.getInvoicePayments(req.user.id, req.params.id);
    return sendSuccess(res, 'Payments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};
