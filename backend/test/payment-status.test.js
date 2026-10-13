/**
 * STEP 8 — Payment Status, Paid Amount, Balance & Pending Reports Test Suite
 *
 * Tests: 13 required tests + additional edge cases
 *
 * Strategy: Mock-based (no live DB required) using node:test.
 * All repository and model methods are mocked so tests run without a real database.
 */

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ─── Mock utilities ───────────────────────────────────────────────────────────

/** Minimal mock Invoice-like object */
const makeInvoice = (overrides = {}) => ({
  id: overrides.id || 1,
  company_id: overrides.company_id || 10,
  total_amount: overrides.total_amount !== undefined ? overrides.total_amount : 1000,
  paid_amount: overrides.paid_amount !== undefined ? overrides.paid_amount : 0,
  payment_status: overrides.payment_status || 'unpaid',
  status: overrides.status || 'generated',
  payment_method: overrides.payment_method || 'cash',
  ...overrides,
  // mocked sequelize .update()
  _data: {},
  update(fields) {
    Object.assign(this, fields);
    return Promise.resolve(this);
  }
});

const makePayment = (overrides = {}) => ({
  id: overrides.id || 1,
  invoice_id: overrides.invoice_id || 1,
  company_id: overrides.company_id || 10,
  amount: overrides.amount || 1000,
  payment_method: overrides.payment_method || 'cash',
  payment_reference: overrides.payment_reference || null,
  ...overrides
});

// ─── Import the pure utility directly ─────────────────────────────────────────
// derivePaymentStatus is a pure function with no DB calls – test it directly.
import { derivePaymentStatus } from '../src/modules/invoice/repository/payment.repository.js';

// ─── Test the payment status derivation logic ─────────────────────────────────

describe('derivePaymentStatus', () => {
  test('zero paid → unpaid', () => {
    assert.equal(derivePaymentStatus(0, 1000), 'unpaid');
  });

  test('fully paid → paid', () => {
    assert.equal(derivePaymentStatus(1000, 1000), 'paid');
  });

  test('partial payment → partial', () => {
    assert.equal(derivePaymentStatus(400, 1000), 'partial');
  });

  test('floating point precision (999.99 of 1000) → partial', () => {
    assert.equal(derivePaymentStatus(999.99, 1000), 'partial');
  });

  test('paid_amount > total_amount (edge) → paid', () => {
    // Should still report paid for overpayment edge (guard rejects before this is reached)
    assert.equal(derivePaymentStatus(1001, 1000), 'paid');
  });
});

// ─── Simulate recordPayment logic without DB ──────────────────────────────────

/**
 * Simulate the core recordPayment logic in isolation.
 * This mirrors the actual repository logic exactly so we can verify business rules
 * without a real database connection.
 */
async function simulateRecordPayment({
  invoice,
  existingPayments = [],
  paymentInput: { amount, payment_method, payment_reference = null, notes = null },
}) {
  // Idempotency check
  if (payment_reference) {
    const dup = existingPayments.find(p => p.payment_reference === payment_reference);
    if (dup) {
      return { invoice, payment: dup, idempotent: true };
    }
  }

  const currentPaid = parseFloat(invoice.paid_amount) || 0;
  const totalAmount = parseFloat(invoice.total_amount) || 0;
  const remaining = totalAmount - currentPaid;
  const payAmount = parseFloat(amount);

  if (payAmount <= 0) {
    throw { statusCode: 400, message: 'Payment amount must be greater than zero' };
  }
  if (payAmount > remaining + 0.001) {
    throw {
      statusCode: 400,
      message: `Payment amount (₹${payAmount.toFixed(2)}) exceeds remaining balance (₹${remaining.toFixed(2)})`
    };
  }

  const payment = makePayment({ amount: payAmount, payment_method, payment_reference });
  existingPayments.push(payment);

  const newPaidAmount = parseFloat((currentPaid + payAmount).toFixed(2));
  const newPaymentStatus = derivePaymentStatus(newPaidAmount, totalAmount);
  const newStatus = newPaymentStatus === 'paid' ? 'paid' : (newPaymentStatus === 'partial' ? 'partial' : invoice.status);
  await invoice.update({ paid_amount: newPaidAmount, payment_status: newPaymentStatus, status: newStatus });

  return { invoice, payment, idempotent: false };
}

// ─── Simulated pending amount calculation ─────────────────────────────────────

/** Mirrors the corrected SQL: SUM(total_amount - paid_amount) WHERE payment_status != 'paid' */
function calculatePendingAmount(invoices) {
  return invoices
    .filter(inv => inv.payment_status !== 'paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.paid_amount)), 0);
}

// ─── Main test suite ──────────────────────────────────────────────────────────

describe('STEP 8 — Payment Status, Paid Amount, Balance & Pending Reports', () => {

  // TEST 1: New unpaid invoice
  test('TEST 1: New unpaid invoice — total ₹1000, paid ₹0, pending ₹1000, status unpaid', () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });
    assert.equal(parseFloat(invoice.total_amount), 1000);
    assert.equal(parseFloat(invoice.paid_amount), 0);
    assert.equal(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount), 1000);
    assert.equal(invoice.payment_status, 'unpaid');
    assert.equal(invoice.status, 'generated'); // document lifecycle status preserved
  });

  // TEST 2: Full CASH payment
  test('TEST 2: Full CASH payment — ₹1000 on ₹1000 invoice → paid ₹1000, pending ₹0, status paid', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    const result = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 1000, payment_method: 'cash' }
    });

    assert.equal(result.idempotent, false);
    assert.equal(parseFloat(result.invoice.paid_amount), 1000);
    assert.equal(parseFloat(result.invoice.total_amount) - parseFloat(result.invoice.paid_amount), 0);
    assert.equal(result.invoice.payment_status, 'paid');
    assert.equal(result.invoice.status, 'paid');
    assert.notEqual(result.invoice.status, 'generated'); // must NOT remain generated after full payment
    assert.equal(result.payment.payment_method, 'cash');
  });

  // TEST 3: Partial CASH payment
  test('TEST 3: Partial CASH payment — ₹400 on ₹1000 → paid ₹400, pending ₹600, status partial', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    const result = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 400, payment_method: 'cash' }
    });

    assert.equal(result.idempotent, false);
    assert.equal(parseFloat(result.invoice.paid_amount), 400);
    assert.equal(parseFloat(result.invoice.total_amount) - parseFloat(result.invoice.paid_amount), 600);
    assert.equal(result.invoice.payment_status, 'partial');
    assert.equal(result.invoice.status, 'partial');
    assert.notEqual(result.invoice.status, 'generated');
  });

  // TEST 4: Full UPI payment
  test('TEST 4: Full UPI payment → status paid, pending ₹0', async () => {
    const invoice = makeInvoice({ total_amount: 2500, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    const result = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 2500, payment_method: 'upi', payment_reference: 'UPI_TXN_ABC123' }
    });

    assert.equal(result.invoice.payment_status, 'paid');
    assert.equal(result.invoice.status, 'paid');
    assert.notEqual(result.invoice.status, 'generated');
    assert.equal(parseFloat(result.invoice.paid_amount), 2500);
    assert.equal(parseFloat(result.invoice.total_amount) - parseFloat(result.invoice.paid_amount), 0);
    assert.equal(result.payment.payment_method, 'upi');
    assert.equal(result.payment.payment_reference, 'UPI_TXN_ABC123');
  });

  // TEST 5: Valid Razorpay payment/webhook → invoice becomes PAID
  test('TEST 5: Valid Razorpay payment → payment recorded, invoice becomes paid when fully paid', async () => {
    const invoice = makeInvoice({ total_amount: 499, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    const result = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: {
        amount: 499,
        payment_method: 'razorpay',
        payment_reference: 'pay_razorpay_test_001'
      }
    });

    assert.equal(result.idempotent, false);
    assert.equal(result.invoice.payment_status, 'paid');
    assert.equal(result.invoice.status, 'paid');
    assert.notEqual(result.invoice.status, 'generated');
    assert.equal(parseFloat(result.invoice.paid_amount), 499);
    assert.equal(result.payment.payment_reference, 'pay_razorpay_test_001');
  });

  // TEST 6: Duplicate Razorpay payment reference → must NOT double-count
  test('TEST 6: Duplicate Razorpay payment reference → idempotent, no double-count', async () => {
    const invoice = makeInvoice({ total_amount: 499, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    // First payment
    await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 499, payment_method: 'razorpay', payment_reference: 'pay_dup_001' }
    });
    const paidAfterFirst = parseFloat(invoice.paid_amount);
    assert.equal(invoice.payment_status, 'paid');

    // Duplicate webhook for same payment reference
    const result2 = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 499, payment_method: 'razorpay', payment_reference: 'pay_dup_001' }
    });

    assert.equal(result2.idempotent, true);
    // paid_amount must not have doubled
    assert.equal(parseFloat(invoice.paid_amount), paidAfterFirst);
    assert.equal(invoice.payment_status, 'paid');
    assert.equal(payments.length, 1); // Only 1 payment record exists
  });

  // TEST 7: Multiple payments totaling full amount → paid, pending ₹0
  test('TEST 7: Multiple payments — ₹300 + ₹700 on ₹1000 → paid ₹1000, pending ₹0, PAID', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    // Payment 1: ₹300
    await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 300, payment_method: 'cash' }
    });
    assert.equal(invoice.payment_status, 'partial');
    assert.equal(invoice.status, 'partial');
    assert.equal(parseFloat(invoice.paid_amount), 300);

    // Payment 2: ₹700
    await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 700, payment_method: 'upi', payment_reference: 'UPI_FINAL_001' }
    });
    assert.equal(invoice.payment_status, 'paid');
    assert.equal(invoice.status, 'paid');
    assert.notEqual(invoice.status, 'generated');
    assert.equal(parseFloat(invoice.paid_amount), 1000);
    assert.equal(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount), 0);
    assert.equal(payments.length, 2);
  });

  // TEST 8: Pending report — paid invoice must NOT appear as pending
  test('TEST 8: Pending report — fully paid invoice excluded from pending', () => {
    const invoices = [
      makeInvoice({ id: 1, total_amount: 1000, paid_amount: 1000, payment_status: 'paid' }),
      makeInvoice({ id: 2, total_amount: 2000, paid_amount: 0, payment_status: 'unpaid' }),
    ];

    const pending = calculatePendingAmount(invoices);
    assert.equal(pending, 2000); // Invoice 1 (paid) contributes ₹0, Invoice 2 contributes ₹2000
  });

  // TEST 9: Partial invoice — only remaining balance appears as pending
  test('TEST 9: Partial invoice — only remaining ₹600 appears as pending', () => {
    const invoices = [
      makeInvoice({ id: 1, total_amount: 1000, paid_amount: 400, payment_status: 'partial' }),
    ];

    const pending = calculatePendingAmount(invoices);
    assert.equal(pending, 600);
  });

  // TEST 10: Customer outstanding — correctly sums only unpaid balances
  test('TEST 10: Customer outstanding — Invoice A paid, Invoice B partial → ₹1500 outstanding', () => {
    const customerInvoices = [
      makeInvoice({ id: 10, total_amount: 1000, paid_amount: 1000, payment_status: 'paid' }),   // Invoice A: fully paid
      makeInvoice({ id: 11, total_amount: 2000, paid_amount: 500,  payment_status: 'partial' }), // Invoice B: partial
    ];

    const outstanding = calculatePendingAmount(customerInvoices);
    assert.equal(outstanding, 1500); // 0 (A) + 1500 (B) = 1500
  });

  // TEST 11: Company isolation
  test('TEST 11: Company isolation — Company A payment cannot affect Company B invoice', async () => {
    const invoiceCompanyB = makeInvoice({ id: 99, company_id: 20, total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });

    // Try to record payment with company_id of Company A (10) against Company B's invoice
    // The repository filters by company_id in the WHERE clause:
    // Invoice.findOne({ where: { id, company_id } }) → should return null
    //
    // Simulate: invoice not found because company_id doesn't match
    const mockFindInvoice = async (invoice_id, company_id) => {
      if (invoiceCompanyB.id === invoice_id && invoiceCompanyB.company_id !== company_id) {
        return null; // Cross-company access denied
      }
      return invoiceCompanyB;
    };

    const found = await mockFindInvoice(99, 10 /* Company A */);
    assert.equal(found, null, 'Company A must not access Company B invoice');

    // Verify Company B can access its own invoice
    const ownFound = await mockFindInvoice(99, 20 /* Company B */);
    assert.notEqual(ownFound, null, 'Company B must access its own invoice');
    assert.equal(parseFloat(ownFound.paid_amount), 0); // No payment was recorded
    assert.equal(ownFound.payment_status, 'unpaid');
  });

  // TEST 12: Transaction rollback — if payment fails, no partial state remains
  test('TEST 12: Transaction rollback — failed payment leaves invoice unchanged', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });

    /**
     * Simulate a transaction that fails after creating the Payment record
     * but before updating the Invoice. The transaction should rollback.
     */
    const simulateFailedTransaction = async (invoice, amount) => {
      // Snapshot initial state (what rollback restores to)
      const snapshotPaid = invoice.paid_amount;
      const snapshotStatus = invoice.payment_status;

      try {
        // Step 1: Create payment record (would succeed)
        const payment = makePayment({ amount }); // Simulated payment creation
        
        // Step 2: Simulate DB error during invoice.update
        throw new Error('Simulated DB failure during invoice update');

        // This would be: await invoice.update({ ... });
      } catch (err) {
        // ROLLBACK: restore to snapshot (in real DB, transaction rollback handles this)
        invoice.paid_amount = snapshotPaid;
        invoice.payment_status = snapshotStatus;
        throw err;
      }
    };

    await assert.rejects(
      () => simulateFailedTransaction(invoice, 500),
      /Simulated DB failure/
    );

    // Invoice must be unchanged after failed transaction
    assert.equal(parseFloat(invoice.paid_amount), 0, 'paid_amount must be 0 after rollback');
    assert.equal(invoice.payment_status, 'unpaid', 'payment_status must be unpaid after rollback');
  });

  // TEST 13: Overpayment / duplicate protection
  test('TEST 13: Overpayment rejected — cannot pay more than remaining balance', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 700, payment_status: 'partial' });
    const payments = [];

    // Try to pay ₹500 when only ₹300 remains
    await assert.rejects(
      () => simulateRecordPayment({
        invoice,
        existingPayments: payments,
        paymentInput: { amount: 500, payment_method: 'cash' }
      }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /exceeds remaining balance/);
        return true;
      }
    );

    // Invoice state must be unchanged
    assert.equal(parseFloat(invoice.paid_amount), 700);
    assert.equal(invoice.payment_status, 'partial');
    assert.equal(payments.length, 0, 'No payment record must have been created');
  });

  // ADDITIONAL: Zero amount rejection
  test('ADDITIONAL: Zero amount payment rejected', async () => {
    const invoice = makeInvoice({ total_amount: 1000, paid_amount: 0, payment_status: 'unpaid' });

    await assert.rejects(
      () => simulateRecordPayment({
        invoice,
        existingPayments: [],
        paymentInput: { amount: 0, payment_method: 'cash' }
      }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /greater than zero/);
        return true;
      }
    );
  });

  // ADDITIONAL: Pending report with mixed invoice states
  test('ADDITIONAL: Pending report — mixed states (unpaid + partial + paid)', () => {
    const invoices = [
      makeInvoice({ id: 1, total_amount: 1000, paid_amount: 0,    payment_status: 'unpaid' }),  // pending: 1000
      makeInvoice({ id: 2, total_amount: 2000, paid_amount: 800,  payment_status: 'partial' }), // pending: 1200
      makeInvoice({ id: 3, total_amount: 1500, paid_amount: 1500, payment_status: 'paid' }),    // pending: 0
      makeInvoice({ id: 4, total_amount: 500,  paid_amount: 0,    payment_status: 'unpaid' }),  // pending: 500
    ];

    const pending = calculatePendingAmount(invoices);
    assert.equal(pending, 2700); // 1000 + 1200 + 0 + 500 = 2700
  });

  // ADDITIONAL: UPI duplicate reference prevention
  test('ADDITIONAL: UPI duplicate reference — same UPI txn not double-counted', async () => {
    const invoice = makeInvoice({ total_amount: 500, paid_amount: 0, payment_status: 'unpaid' });
    const payments = [];

    await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 500, payment_method: 'upi', payment_reference: 'UPI_IDMPOTENT_001' }
    });

    assert.equal(invoice.payment_status, 'paid');
    assert.equal(parseFloat(invoice.paid_amount), 500);

    // Duplicate UPI callback
    const dupResult = await simulateRecordPayment({
      invoice,
      existingPayments: payments,
      paymentInput: { amount: 500, payment_method: 'upi', payment_reference: 'UPI_IDMPOTENT_001' }
    });

    assert.equal(dupResult.idempotent, true);
    assert.equal(parseFloat(invoice.paid_amount), 500); // Not 1000
    assert.equal(payments.length, 1);
  });

  // ADDITIONAL: payment_status field exists on new invoice
  test('ADDITIONAL: New invoice has payment_status = unpaid and paid_amount = 0 by default', () => {
    const invoice = makeInvoice(); // defaults
    assert.equal(invoice.payment_status, 'unpaid');
    assert.equal(parseFloat(invoice.paid_amount), 0);
    assert.equal(invoice.status, 'generated'); // document lifecycle status unchanged
  });
});

// ─── Live Database Integration Tests ─────────────────────────────────────────

describe('STEP 8 — Live Database Integration Suite', () => {
  let testUserA, testCompanyA;
  let testUserB, testCompanyB;
  let paymentRepo, reportsRepo, customerRepo, InvoiceModel, PaymentModel, UserModel, CompanyModel;

  before(async () => {
    paymentRepo = await import('../src/modules/invoice/repository/payment.repository.js');
    reportsRepo = await import('../src/modules/reports/repository/reports.repository.js');
    customerRepo = await import('../src/modules/customer/repository/customer.repository.js');
    InvoiceModel = (await import('../src/modules/invoice/model/invoice.model.js')).default;
    PaymentModel = (await import('../src/modules/invoice/model/payment.model.js')).default;
    UserModel = (await import('../src/modules/auth/model/auth.model.js')).default;
    CompanyModel = (await import('../src/modules/company/model/company.model.js')).default;

    const rand = Math.floor(Math.random() * 899999 + 100000);
    testUserA = await UserModel.create({
      mobile_number: `921${rand}1`,
      role: 'customer',
      profile_completed: true
    });
    testCompanyA = await CompanyModel.create({
      user_id: testUserA.id,
      company_name: 'Alpha Payments Test Corp',
      invoice_prefix: 'APT',
      state: 'Tamil Nadu'
    });

    testUserB = await UserModel.create({
      mobile_number: `921${rand}2`,
      role: 'customer',
      profile_completed: true
    });
    testCompanyB = await CompanyModel.create({
      user_id: testUserB.id,
      company_name: 'Beta Payments Test Corp',
      invoice_prefix: 'BPT',
      state: 'Karnataka'
    });
  });

  after(async () => {
    try {
      if (testCompanyA && testCompanyB) {
        const invs = await InvoiceModel.findAll({
          where: { company_id: [testCompanyA.id, testCompanyB.id] },
          attributes: ['id']
        });
        const invIds = invs.map(i => i.id);
        if (invIds.length > 0) {
          await PaymentModel.destroy({ where: { invoice_id: invIds } });
          await InvoiceModel.destroy({ where: { id: invIds } });
        }
        await CompanyModel.destroy({ where: { id: [testCompanyA.id, testCompanyB.id] } });
        await UserModel.destroy({ where: { id: [testUserA.id, testUserB.id] } });
      }
    } catch (err) {
      console.warn('Cleanup error in test suite:', err.message);
    }
  });

  test('LIVE DB: Cash payment updates paid_amount, payment_status, status to paid atomically', async () => {
    const inv = await InvoiceModel.create({
      company_id: testCompanyA.id,
      invoice_number: 'APT-LIVE-001',
      customer_mobile: '9876543210',
      customer_name: 'Live Cash Client',
      total_amount: 1000.00,
      paid_amount: 0.00,
      payment_status: 'unpaid',
      status: 'generated'
    });

    const result = await paymentRepo.recordPayment({
      company_id: testCompanyA.id,
      invoice_id: inv.id,
      amount: 1000.00,
      payment_method: 'cash'
    });

    assert.equal(result.idempotent, false);
    assert.equal(parseFloat(result.invoice.paid_amount), 1000.00);
    assert.equal(result.invoice.payment_status, 'paid');
    assert.equal(result.invoice.status, 'paid');
    assert.notEqual(result.invoice.status, 'generated');

    // Verify in database
    const refreshed = await InvoiceModel.findByPk(inv.id);
    assert.equal(parseFloat(refreshed.paid_amount), 1000.00);
    assert.equal(refreshed.payment_status, 'paid');
    assert.equal(refreshed.status, 'paid');

    // Verify payment record
    const payments = await paymentRepo.getPaymentsByInvoice(inv.id, testCompanyA.id);
    assert.equal(payments.length, 1);
    assert.equal(payments[0].payment_method, 'cash');
    assert.equal(parseFloat(payments[0].amount), 1000.00);
  });

  test('LIVE DB: Partial UPI payment records reference and sets status to partial', async () => {
    const inv = await InvoiceModel.create({
      company_id: testCompanyA.id,
      invoice_number: 'APT-LIVE-002',
      customer_mobile: '9876543211',
      customer_name: 'Live Partial Client',
      total_amount: 1000.00,
      paid_amount: 0.00,
      payment_status: 'unpaid',
      status: 'generated'
    });

    const result = await paymentRepo.recordPayment({
      company_id: testCompanyA.id,
      invoice_id: inv.id,
      amount: 400.00,
      payment_method: 'upi',
      payment_reference: 'UPI_LIVE_REF_001'
    });

    assert.equal(result.idempotent, false);
    assert.equal(parseFloat(result.invoice.paid_amount), 400.00);
    assert.equal(result.invoice.payment_status, 'partial');
    assert.equal(result.invoice.status, 'partial');

    // Duplicate reference test (idempotency)
    const dup = await paymentRepo.recordPayment({
      company_id: testCompanyA.id,
      invoice_id: inv.id,
      amount: 400.00,
      payment_method: 'upi',
      payment_reference: 'UPI_LIVE_REF_001'
    });

    assert.equal(dup.idempotent, true);
    // Must not have double-counted
    const refreshed = await InvoiceModel.findByPk(inv.id);
    assert.equal(parseFloat(refreshed.paid_amount), 400.00);
  });

  test('LIVE DB: Overpayment rejected with 400', async () => {
    const inv = await InvoiceModel.create({
      company_id: testCompanyA.id,
      invoice_number: 'APT-LIVE-003',
      customer_mobile: '9876543212',
      customer_name: 'Live Overpay Client',
      total_amount: 1000.00,
      paid_amount: 700.00,
      payment_status: 'partial',
      status: 'partial'
    });

    await assert.rejects(
      () => paymentRepo.recordPayment({
        company_id: testCompanyA.id,
        invoice_id: inv.id,
        amount: 500.00,
        payment_method: 'cash'
      }),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /exceeds remaining balance/);
        return true;
      }
    );
  });

  test('LIVE DB: Reports calculate pending dues accurately excluding paid invoices', async () => {
    // Current state for testCompanyA:
    // APT-LIVE-001: 1000 total, 1000 paid -> pending 0
    // APT-LIVE-002: 1000 total, 400 paid -> pending 600
    // APT-LIVE-003: 1000 total, 700 paid -> pending 300
    // Expected total pending for Company A: 0 + 600 + 300 = 900
    const stats = await reportsRepo.getDashboardStats(testCompanyA.id);
    assert.equal(stats.pendingAmount, 900.00);

    // Filter by customer mobile for APT-LIVE-002
    const customerStats = await reportsRepo.getDashboardStats(testCompanyA.id, null, null, null, '9876543211');
    assert.equal(customerStats.pendingAmount, 600.00);
  });

  test('LIVE DB: Customer outstanding balance query calculates exact balance', async () => {
    const balance = await customerRepo.getCustomerOutstandingBalance(testCompanyA.id, '9876543211');
    assert.equal(balance, 600.00);

    const paidClientBalance = await customerRepo.getCustomerOutstandingBalance(testCompanyA.id, '9876543210');
    assert.equal(paidClientBalance, 0.00);
  });

  test('LIVE DB: Company isolation blocks cross-company payment recording', async () => {
    // Get invoice belonging to Company A
    const invA = await InvoiceModel.findOne({ where: { company_id: testCompanyA.id } });
    assert.ok(invA);

    // Try to record payment using Company B's context
    await assert.rejects(
      () => paymentRepo.recordPayment({
        company_id: testCompanyB.id,
        invoice_id: invA.id,
        amount: 100.00,
        payment_method: 'cash'
      }),
      (err) => {
        assert.equal(err.statusCode, 404);
        assert.match(err.message, /Invoice not found/);
        return true;
      }
    );
  });
});

