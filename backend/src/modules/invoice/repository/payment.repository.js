import sequelize from '../../../config/db.js';
import Invoice from '../model/invoice.model.js';
import Payment from '../model/payment.model.js';

/**
 * Derive payment_status from paid_amount vs total_amount.
 *
 * @param {number} paidAmount
 * @param {number} totalAmount
 * @returns {'paid'|'partial'|'unpaid'}
 */
export const derivePaymentStatus = (paidAmount, totalAmount) => {
  const paid = parseFloat(paidAmount) || 0;
  const total = parseFloat(totalAmount) || 0;
  if (paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
};

/**
 * Record a payment for an invoice inside a transaction.
 *
 * Rules enforced here:
 *  1. Invoice must belong to company (multi-tenant isolation).
 *  2. If payment_reference already exists for this invoice → idempotent skip.
 *  3. Payment amount must not make paid_amount exceed total_amount (overpayment guard).
 *  4. All writes (Payment row + Invoice paid_amount + Invoice payment_status)
 *     happen atomically inside a single DB transaction.
 *
 * @param {object} opts
 * @param {number} opts.company_id   – Authenticated company (from JWT, never trust frontend)
 * @param {number} opts.invoice_id
 * @param {number} opts.amount       – Payment amount for this transaction
 * @param {string} opts.payment_method
 * @param {string|null} opts.payment_reference  – External reference for idempotency (nullable for cash)
 * @param {string|null} opts.notes
 * @returns {{ invoice: Invoice, payment: Payment|null, idempotent: boolean }}
 */
export const recordPayment = async ({
  company_id,
  invoice_id,
  amount,
  payment_method,
  payment_reference = null,
  notes = null,
}) => {
  return await sequelize.transaction(async (t) => {
    // 1. Load invoice with row-level lock (prevents concurrent payment race conditions)
    const invoice = await Invoice.findOne({
      where: { id: invoice_id, company_id },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!invoice) {
      throw { statusCode: 404, message: 'Invoice not found' };
    }

    // 2. Idempotency: if payment_reference already recorded for this invoice, skip
    if (payment_reference) {
      const existing = await Payment.findOne({
        where: { invoice_id, payment_reference },
        transaction: t,
      });
      if (existing) {
        // Already processed – return current state without side effects
        return { invoice, payment: existing, idempotent: true };
      }
    }

    const currentPaid = parseFloat(invoice.paid_amount) || 0;
    const totalAmount = parseFloat(invoice.total_amount) || 0;
    const remaining = totalAmount - currentPaid;

    // 3. Overpayment guard: reject if amount exceeds remaining balance
    const payAmount = parseFloat(amount);
    if (payAmount <= 0) {
      throw { statusCode: 400, message: 'Payment amount must be greater than zero' };
    }
    if (payAmount > remaining + 0.001) {
      // allow ₹0.001 rounding tolerance
      throw {
        statusCode: 400,
        message: `Payment amount (₹${payAmount.toFixed(2)}) exceeds remaining balance (₹${remaining.toFixed(2)})`,
      };
    }

    // 4. Create the Payment record
    const payment = await Payment.create({
      company_id,
      invoice_id,
      amount: payAmount,
      payment_method,
      payment_reference,
      notes,
    }, { transaction: t });

    // 5. Update Invoice: paid_amount, payment_status, and status (atomic with payment creation)
    const newPaidAmount = parseFloat((currentPaid + payAmount).toFixed(2));
    const newPaymentStatus = derivePaymentStatus(newPaidAmount, totalAmount);

    const updateFields = {
      paid_amount: newPaidAmount,
      payment_status: newPaymentStatus,
    };
    if (newPaymentStatus === 'paid') {
      updateFields.status = 'paid';
    } else if (newPaymentStatus === 'partial') {
      updateFields.status = 'partial';
    }
    if (payment_method) {
      updateFields.payment_method = payment_method;
    }

    await invoice.update(updateFields, { transaction: t });

    return { invoice, payment, idempotent: false };
  });
};

/**
 * Get all payment records for a given invoice (company-scoped).
 */
export const getPaymentsByInvoice = async (invoice_id, company_id) => {
  return await Payment.findAll({
    where: { invoice_id, company_id },
    order: [['created_at', 'ASC']],
  });
};
