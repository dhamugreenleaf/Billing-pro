import * as paymentRepo from '../repository/payment.repository.js';
import * as companyService from '../../company/services/company.service.js';
import * as invoiceRepo from '../repository/invoice.repository.js';

/**
 * Record a payment for an invoice.
 *
 * This service:
 *  - resolves the authenticated company (never trusts frontend company_id)
 *  - validates the invoice belongs to that company
 *  - delegates to the repository for atomic DB writes
 *
 * @param {number} user_id           – Authenticated user ID (from JWT)
 * @param {number} invoice_id
 * @param {object} paymentData
 * @param {number}      paymentData.amount
 * @param {string}      paymentData.payment_method   – e.g. 'cash', 'upi', 'card', 'razorpay'
 * @param {string|null} paymentData.payment_reference – External txn ref for idempotency
 * @param {string|null} paymentData.notes
 */
export const recordPayment = async (user_id, invoice_id, paymentData) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) {
    throw { statusCode: 400, message: 'Company profile not found' };
  }

  const { amount, payment_method, payment_reference = null, notes = null } = paymentData;

  if (!payment_method) {
    throw { statusCode: 400, message: 'payment_method is required' };
  }

  const result = await paymentRepo.recordPayment({
    company_id: company.id,  // authoritative: from server-side session, never from frontend
    invoice_id: parseInt(invoice_id, 10),
    amount,
    payment_method,
    payment_reference: payment_reference || null,
    notes,
  });

  return result;
};

/**
 * Get all payment records for an invoice (company-scoped).
 */
export const getInvoicePayments = async (user_id, invoice_id) => {
  const company = await companyService.getCompanyProfile(user_id);
  if (!company) {
    throw { statusCode: 400, message: 'Company profile not found' };
  }

  // Ensure invoice belongs to company
  const invoice = await invoiceRepo.getInvoiceById(invoice_id, company.id);
  if (!invoice) {
    throw { statusCode: 404, message: 'Invoice not found' };
  }

  const payments = await paymentRepo.getPaymentsByInvoice(invoice_id, company.id);
  return { invoice, payments };
};
