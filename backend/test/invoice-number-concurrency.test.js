import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import sequelize from '../src/config/db.js';
import * as invoiceService from '../src/modules/invoice/services/invoice.service.js';
import * as invoiceRepo from '../src/modules/invoice/repository/invoice.repository.js';
import Company from '../src/modules/company/model/company.model.js';
import User from '../src/modules/auth/model/auth.model.js';
import Invoice from '../src/modules/invoice/model/invoice.model.js';
import InvoiceItem from '../src/modules/invoice/model/invoiceItem.model.js';
import Customer from '../src/modules/customer/model/customer.model.js';
import Subscription from '../src/modules/subscription/model/subscription.model.js';
import Plan from '../src/modules/subscription/model/plan.model.js';

describe('STEP 7 — Concurrency-Safe Invoice Number Generation Suite', () => {
  let userA, companyA;
  let userB, companyB;
  let proPlan;

  before(async () => {
    // 1. Ensure test users, companies, and plan in real DB for transactional concurrency testing
    proPlan = await Plan.findOne({ where: { name: 'Pro' } });
    if (!proPlan) {
      proPlan = await Plan.create({
        name: 'Pro',
        price: 10,
        billing_cycle: 'monthly',
        features: ['Unlimited Bills']
      });
    }

    // Create unique test users
    const rand = Math.floor(Math.random() * 899999 + 100000);
    userA = await User.create({
      mobile_number: `919${rand}1`,
      role: 'customer',
      profile_completed: true
    });
    companyA = await Company.create({
      user_id: userA.id,
      company_name: 'Alpha Concurrency Corp',
      invoice_prefix: 'ALP',
      state: 'Tamil Nadu'
    });
    await Subscription.create({
      user_id: userA.id,
      plan_id: proPlan.id,
      status: 'active',
      start_date: new Date(),
      amount: 0
    });

    userB = await User.create({
      mobile_number: `919${rand}2`,
      role: 'customer',
      profile_completed: true
    });
    companyB = await Company.create({
      user_id: userB.id,
      company_name: 'Beta Concurrency Corp',
      invoice_prefix: 'BET',
      state: 'Karnataka'
    });
    await Subscription.create({
      user_id: userB.id,
      plan_id: proPlan.id,
      status: 'active',
      start_date: new Date(),
      amount: 0
    });
  });

  after(async () => {
    // Clean up created test data cleanly
    try {
      if (companyA && companyB) {
        const invIds = (await Invoice.findAll({
          where: { company_id: [companyA.id, companyB.id] },
          attributes: ['id']
        })).map(i => i.id);

        if (invIds.length > 0) {
          await InvoiceItem.destroy({ where: { invoice_id: invIds } });
          await Invoice.destroy({ where: { id: invIds } });
        }
        await Customer.destroy({ where: { company_id: [companyA.id, companyB.id] } });
        await Subscription.destroy({ where: { user_id: [userA.id, userB.id] } });
        await Company.destroy({ where: { id: [companyA.id, companyB.id] } });
        await User.destroy({ where: { id: [userA.id, userB.id] } });
      }
    } catch (err) {
      console.warn('Cleanup error in test suite:', err.message);
    }
  });

  // TEST 1: Single invoice creation -> correct invoice number
  test('TEST 1: Single invoice creation yields correct sequential number', async () => {
    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876500001',
      customer_name: 'Client 1',
      billing_address: 'Address 1',
      shipping_address: 'Address 1',
      items: [{ description: 'Test Item', unit_price: 100, quantity: 1 }]
    });

    assert.ok(invoice);
    assert.equal(invoice.invoice_number, 'ALP-000001');
    assert.equal(invoice.company_id, companyA.id);
  });

  // TEST 2: Two concurrent invoices -> unique numbers
  test('TEST 2: Two concurrent invoices receive distinct, non-colliding numbers', async () => {
    const promises = [
      invoiceService.generateInvoice(userA.id, {
        customer_mobile: '9876500002',
        customer_name: 'Client 2A',
        billing_address: 'Address 2A',
        shipping_address: 'Address 2A',
        items: [{ description: 'Item 2A', unit_price: 200, quantity: 1 }]
      }),
      invoiceService.generateInvoice(userA.id, {
        customer_mobile: '9876500003',
        customer_name: 'Client 2B',
        billing_address: 'Address 2B',
        shipping_address: 'Address 2B',
        items: [{ description: 'Item 2B', unit_price: 300, quantity: 1 }]
      })
    ];

    const results = await Promise.all(promises);
    assert.equal(results.length, 2);
    assert.notEqual(results[0].invoice_number, results[1].invoice_number);

    const nums = results.map(r => r.invoice_number).sort();
    assert.deepEqual(nums, ['ALP-000002', 'ALP-000003']);
  });

  // TEST 3: 10 concurrent invoices -> 10 unique numbers
  test('TEST 3: 10 simultaneous concurrent requests produce 10 unique sequential numbers with zero duplicates', async () => {
    const tasks = Array.from({ length: 10 }, (_, i) => 
      invoiceService.generateInvoice(userA.id, {
        customer_mobile: `987650001${i}`,
        customer_name: `Concurrent Client ${i}`,
        billing_address: `Address ${i}`,
        shipping_address: `Address ${i}`,
        items: [{ description: `Item ${i}`, unit_price: 100 + i, quantity: 1 }]
      })
    );

    const invoices = await Promise.all(tasks);
    assert.equal(invoices.length, 10);

    const numbers = invoices.map(inv => inv.invoice_number);
    const uniqueNumbers = new Set(numbers);
    assert.equal(uniqueNumbers.size, 10, 'All 10 invoice numbers must be unique');

    // Expected sequence range: ALP-000004 to ALP-000013
    const expected = Array.from({ length: 10 }, (_, i) => `ALP-${String(i + 4).padStart(6, '0')}`).sort();
    assert.deepEqual(numbers.slice().sort(), expected);
  });

  // TEST 4: 20 concurrent invoices -> 20 unique numbers
  test('TEST 4: 20 simultaneous concurrent requests produce 20 unique numbers under high load', async () => {
    const tasks = Array.from({ length: 20 }, (_, i) => 
      invoiceService.generateInvoice(userA.id, {
        customer_mobile: `987650002${i.toString().padStart(2, '0')}`,
        customer_name: `Load Client ${i}`,
        billing_address: `Address ${i}`,
        shipping_address: `Address ${i}`,
        items: [{ description: `Bulk Item ${i}`, unit_price: 50, quantity: 1 }]
      })
    );

    const invoices = await Promise.all(tasks);
    assert.equal(invoices.length, 20);

    const numbers = invoices.map(inv => inv.invoice_number);
    const uniqueNumbers = new Set(numbers);
    assert.equal(uniqueNumbers.size, 20, 'All 20 invoice numbers must be completely unique');

    // Expected sequence range: ALP-000014 to ALP-000033
    const expected = Array.from({ length: 20 }, (_, i) => `ALP-${String(i + 14).padStart(6, '0')}`).sort();
    assert.deepEqual(numbers.slice().sort(), expected);
  });

  // TEST 5: Existing invoice format preserved
  test('TEST 5: Existing invoice number format (PREFIX-000000) is strictly preserved', async () => {
    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876500055',
      customer_name: 'Format Check Client',
      billing_address: 'Format Address',
      shipping_address: 'Format Address',
      items: [{ description: 'Format Item', unit_price: 100, quantity: 1 }]
    });

    assert.match(invoice.invoice_number, /^ALP-\d{6}$/);
  });

  // TEST 6: Duplicate invoice number rejected / prevented by DB unique constraint
  test('TEST 6: Attempting to insert duplicate (company_id, invoice_number) is rejected by DB unique constraint', async () => {
    let duplicateRejected = false;
    try {
      await Invoice.create({
        company_id: companyA.id,
        invoice_number: 'ALP-000001', // Already created in TEST 1
        customer_mobile: '9876500099',
        customer_name: 'Attacker',
        billing_address: 'Test',
        shipping_address: 'Test',
        total_amount: 100
      });
    } catch (err) {
      duplicateRejected = true;
      assert.ok(
        err.name === 'SequelizeUniqueConstraintError' || 
        err.message.includes('unique') || 
        err.message.includes('duplicate key')
      );
    }

    assert.equal(duplicateRejected, true, 'Database unique constraint must block duplicate (company_id, invoice_number)');
  });

  // TEST 7: Failed transaction does not create duplicate invoice
  test('TEST 7: Failed transaction rolls back safely without corrupting sequence or creating duplicate', async () => {
    // Attempt invoice creation with an invalid payload inside repository
    let failed = false;
    try {
      await invoiceRepo.createInvoice({
        company_id: companyA.id,
        _invoice_prefix: 'ALP',
        customer_mobile: '9876500099',
        customer_name: 'Rollback Client',
        total_amount: 'INVALID_NON_NUMERIC_AMOUNT_THAT_ERRORS'
      }, []);
    } catch {
      failed = true;
    }
    assert.equal(failed, true, 'Transaction must fail and roll back');

    // Next successful invoice creation succeeds cleanly with a valid unique number
    const nextInvoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876500077',
      customer_name: 'Next Client',
      billing_address: 'Address',
      shipping_address: 'Address',
      items: [{ description: 'Item', unit_price: 150, quantity: 1 }]
    });

    assert.ok(nextInvoice);
    assert.ok(nextInvoice.invoice_number.startsWith('ALP-'));
  });

  // TEST 8: Company A and Company B isolation
  test('TEST 8: Company A and Company B sequences are completely isolated (Multi-Tenancy)', async () => {
    // Run concurrent invoices across Company A and Company B simultaneously
    const tasks = [
      ...Array.from({ length: 5 }, (_, i) => 
        invoiceService.generateInvoice(userA.id, {
          customer_mobile: `987650008${i}`,
          customer_name: `Company A Client ${i}`,
          billing_address: 'A',
          shipping_address: 'A',
          items: [{ description: 'A Item', unit_price: 10, quantity: 1 }]
        })
      ),
      ...Array.from({ length: 5 }, (_, i) => 
        invoiceService.generateInvoice(userB.id, {
          customer_mobile: `987650009${i}`,
          customer_name: `Company B Client ${i}`,
          billing_address: 'B',
          shipping_address: 'B',
          items: [{ description: 'B Item', unit_price: 20, quantity: 1 }]
        })
      )
    ];

    const results = await Promise.all(tasks);
    const companyAInvoices = results.filter(r => r.company_id === companyA.id);
    const companyBInvoices = results.filter(r => r.company_id === companyB.id);

    assert.equal(companyAInvoices.length, 5);
    assert.equal(companyBInvoices.length, 5);

    // Verify Company A prefixes are all ALP-
    assert.ok(companyAInvoices.every(r => r.invoice_number.startsWith('ALP-')));

    // Verify Company B prefixes are all BET- and start from BET-000001
    assert.ok(companyBInvoices.every(r => r.invoice_number.startsWith('BET-')));
    const companyBNumbers = companyBInvoices.map(r => r.invoice_number).sort();
    assert.deepEqual(companyBNumbers, [
      'BET-000001',
      'BET-000002',
      'BET-000003',
      'BET-000004',
      'BET-000005'
    ]);
  });

  // TEST 9: Historical invoices remain accessible
  test('TEST 9: Historical invoices remain accessible by ID and by invoice_number', async () => {
    const historical = await Invoice.findOne({
      where: { company_id: companyA.id, invoice_number: 'ALP-000001' }
    });

    assert.ok(historical);
    assert.equal(historical.invoice_number, 'ALP-000001');

    const byId = await invoiceRepo.getInvoiceById(historical.id, companyA.id);
    assert.ok(byId);
    assert.equal(byId.invoice_number, 'ALP-000001');
  });

  // TEST 10: Existing invoice creation regression test
  test('TEST 10: Existing invoice creation regression test succeeds with full tax calculation', async () => {
    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Regression Client',
      billing_address: 'Chennai, Tamil Nadu',
      shipping_address: 'Chennai, Tamil Nadu',
      gst_enabled: true,
      gst_rate: 18,
      place_of_supply: 'Tamil Nadu',
      items: [
        { description: 'Widget Alpha', unit_price: 1000, quantity: 2 }
      ]
    });

    assert.ok(invoice);
    assert.equal(Number(invoice.taxable_amount), 2000.00);
    assert.equal(Number(invoice.cgst_amount), 180.00);
    assert.equal(Number(invoice.sgst_amount), 180.00);
    assert.equal(Number(invoice.igst_amount), 0.00);
    assert.equal(Number(invoice.total_amount), 2360.00);
    assert.ok(invoice.invoice_number.startsWith('ALP-'));
  });
});
