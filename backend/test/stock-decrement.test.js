import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import sequelize from '../src/config/db.js';
import User from '../src/modules/auth/model/auth.model.js';
import Company from '../src/modules/company/model/company.model.js';
import Customer from '../src/modules/customer/model/customer.model.js';
import Plan from '../src/modules/subscription/model/plan.model.js';
import Subscription from '../src/modules/subscription/model/subscription.model.js';
import Product from '../src/modules/product/model/product.model.js';
import Invoice from '../src/modules/invoice/model/invoice.model.js';
import InvoiceItem from '../src/modules/invoice/model/invoiceItem.model.js';
import * as invoiceService from '../src/modules/invoice/services/invoice.service.js';
import * as invoiceRepo from '../src/modules/invoice/repository/invoice.repository.js';

describe('STEP 9 — Transactional & Concurrency-Safe Stock Decrement Suite', () => {
  let userA, companyA, userB, companyB;
  let proPlan;

  before(async () => {
    // Ensure Pro plan exists
    [proPlan] = await Plan.findOrCreate({
      where: { name: 'Pro' },
      defaults: {
        price: 999,
        duration_days: 30,
        features: JSON.stringify({ unlimited_invoices: true })
      }
    });

    const rand = Math.floor(Math.random() * 899999 + 100000);

    // Company A
    userA = await User.create({
      mobile_number: `918${rand}1`,
      role: 'customer',
      profile_completed: true
    });
    companyA = await Company.create({
      user_id: userA.id,
      company_name: 'Company Alpha Stock',
      invoice_prefix: 'STK',
      state: 'Maharashtra'
    });
    await Subscription.create({
      user_id: userA.id,
      plan_id: proPlan.id,
      status: 'active',
      start_date: new Date(),
      amount: 0
    });

    // Company B
    userB = await User.create({
      mobile_number: `918${rand}2`,
      role: 'customer',
      profile_completed: true
    });
    companyB = await Company.create({
      user_id: userB.id,
      company_name: 'Company Beta Stock',
      invoice_prefix: 'STKB',
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
        await Product.destroy({ where: { company_id: [companyA.id, companyB.id] } });
        await Customer.destroy({ where: { company_id: [companyA.id, companyB.id] } });
        await Subscription.destroy({ where: { user_id: [userA.id, userB.id] } });
        await Company.destroy({ where: { id: [companyA.id, companyB.id] } });
        await User.destroy({ where: { id: [userA.id, userB.id] } });
      }
    } catch (err) {
      console.warn('Cleanup error in stock test suite:', err.message);
    }
  });

  // TEST 1: Single product decrement (100 - 5 = 95)
  test('TEST 1: Create invoice with one product -> stock decrements correctly (100 - 5 = 95)', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Item T1',
      stock_quantity: 100,
      selling_price: 200
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Customer T1',
      billing_address: 'Addr 1',
      shipping_address: 'Addr 1',
      items: [
        {
          product_id: product.id,
          description: 'Item T1 Description',
          quantity: 5,
          unit_price: 200
        }
      ]
    });

    assert.ok(invoice);
    assert.equal(invoice.items.length, 1);
    assert.equal(invoice.items[0].product_id, product.id);

    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 95);
  });

  // TEST 2: Multiple products decrement independently
  test('TEST 2: Create invoice with multiple products -> stock decreases independently', async () => {
    const prodA = await Product.create({
      company_id: companyA.id,
      product_name: 'Product A',
      stock_quantity: 100,
      selling_price: 50
    });
    const prodB = await Product.create({
      company_id: companyA.id,
      product_name: 'Product B',
      stock_quantity: 50,
      selling_price: 150
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Customer T2',
      billing_address: 'Addr 2',
      shipping_address: 'Addr 2',
      items: [
        { product_id: prodA.id, quantity: 5, unit_price: 50 },
        { product_id: prodB.id, quantity: 2, unit_price: 150 }
      ]
    });

    assert.ok(invoice);
    const reloadedA = await Product.findByPk(prodA.id);
    const reloadedB = await Product.findByPk(prodB.id);

    assert.equal(reloadedA.stock_quantity, 95); // 100 - 5
    assert.equal(reloadedB.stock_quantity, 48); // 50 - 2
  });

  // TEST 3: Insufficient stock rejected
  test('TEST 3: Insufficient stock (stock=3, req=5) -> 400 rejection, 0 invoice, stock unchanged', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Low Stock Item',
      stock_quantity: 3,
      selling_price: 500
    });

    const preInvoiceCount = await Invoice.count({ where: { company_id: companyA.id } });

    await assert.rejects(
      async () => {
        await invoiceService.generateInvoice(userA.id, {
          customer_mobile: '9876543210',
          customer_name: 'Customer T3',
          billing_address: 'Addr 3',
          shipping_address: 'Addr 3',
          items: [{ product_id: product.id, quantity: 5, unit_price: 500 }]
        });
      },
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /Insufficient stock/i);
        return true;
      }
    );

    const postInvoiceCount = await Invoice.count({ where: { company_id: companyA.id } });
    assert.equal(postInvoiceCount, preInvoiceCount);

    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 3);
  });

  // TEST 4: Transaction rollback restores stock if failure occurs
  test('TEST 4: Transaction rollback -> database error during creation leaves stock unchanged', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Rollback Item',
      stock_quantity: 20,
      selling_price: 100
    });

    // Force an error inside createInvoice by temporarily intercepting Invoice.create
    const originalInvoiceCreate = Invoice.create;
    Invoice.create = async () => {
      throw new Error('Forced DB failure during invoice insert');
    };

    try {
      await assert.rejects(
        async () => {
          await invoiceService.generateInvoice(userA.id, {
            customer_mobile: '9876543210',
            customer_name: 'Customer T4',
            billing_address: 'Addr 4',
            shipping_address: 'Addr 4',
            items: [{ product_id: product.id, quantity: 10, unit_price: 100 }]
          });
        },
        /Forced DB failure/
      );
    } finally {
      Invoice.create = originalInvoiceCreate;
    }

    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 20); // Unchanged!
  });

  // TEST 5: Concurrent sales (Initial stock = 10, 4 requests for 3 units each = 12 total)
  test('TEST 5: Concurrent sales -> row-level locking prevents negative stock (10 stock, 4 x 3 requests)', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Contended Item',
      stock_quantity: 10,
      selling_price: 100
    });

    // Fire 4 concurrent invoice creation requests
    const promises = [1, 2, 3, 4].map(i =>
      invoiceService.generateInvoice(userA.id, {
        customer_mobile: `987654321${i}`,
        customer_name: `Customer Concurrent ${i}`,
        billing_address: 'Addr Concurrent',
        shipping_address: 'Addr Concurrent',
        items: [{ product_id: product.id, quantity: 3, unit_price: 100 }]
      }).then(res => ({ success: true, res })).catch(err => ({ success: false, err }))
    );

    const results = await Promise.all(promises);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    // Initial stock was 10. Each sells 3. 3 * 3 = 9. 4th would require 12 > 10.
    // Exactly 3 must succeed, 1 must fail.
    assert.equal(successful.length, 3, 'Exactly 3 invoices must succeed');
    assert.equal(failed.length, 1, 'Exactly 1 invoice must fail due to stock depletion');
    assert.equal(failed[0].err.statusCode, 400);
    assert.match(failed[0].err.message, /Insufficient stock/i);

    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 1); // 10 - 9 = 1
    assert.ok(reloaded.stock_quantity >= 0, 'Stock must never become negative');
  });

  // TEST 6: Multi-tenant isolation (Company B cannot sell Company A product)
  test('TEST 6: Multi-tenant isolation -> Company B cannot create invoice using Company A product', async () => {
    const productA = await Product.create({
      company_id: companyA.id,
      product_name: 'Company A Secret Item',
      stock_quantity: 50,
      selling_price: 100
    });

    const preInvoiceCountB = await Invoice.count({ where: { company_id: companyB.id } });

    await assert.rejects(
      async () => {
        await invoiceService.generateInvoice(userB.id, {
          customer_mobile: '9876543210',
          customer_name: 'Attacker B',
          billing_address: 'Addr B',
          shipping_address: 'Addr B',
          items: [{ product_id: productA.id, quantity: 1, unit_price: 100 }]
        });
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.match(err.message, /does not belong to your company/i);
        return true;
      }
    );

    const postInvoiceCountB = await Invoice.count({ where: { company_id: companyB.id } });
    assert.equal(postInvoiceCountB, preInvoiceCountB);

    const reloadedA = await Product.findByPk(productA.id);
    assert.equal(reloadedA.stock_quantity, 50); // Untouched
  });

  // TEST 7: Multiple invoice items referencing the same product in one invoice
  test('TEST 7: Multiple line items referencing same product -> decrements sum of quantities', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Multi-line Product',
      stock_quantity: 20,
      selling_price: 100
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Customer T7',
      billing_address: 'Addr 7',
      shipping_address: 'Addr 7',
      items: [
        { product_id: product.id, quantity: 3, unit_price: 100 },
        { product_id: product.id, quantity: 4, unit_price: 100 }
      ]
    });

    assert.ok(invoice);
    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 13); // 20 - (3 + 4) = 13
  });

  // TEST 8: Service / non-stock product
  test('TEST 8: Service / non-stock item -> invoice created, stock is not modified', async () => {
    const serviceProduct = await Product.create({
      company_id: companyA.id,
      product_name: 'Consulting Service',
      category: 'Services',
      stock_quantity: 0,
      selling_price: 1500
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Client T8',
      billing_address: 'Addr 8',
      shipping_address: 'Addr 8',
      items: [{ product_id: serviceProduct.id, quantity: 3, unit_price: 1500 }]
    });

    assert.ok(invoice);
    const reloaded = await Product.findByPk(serviceProduct.id);
    assert.equal(reloaded.stock_quantity, 0); // Not decremented, remains 0
  });

  // TEST 9: Invoice creation regression (GST, Place of supply, payment tracking, invoice numbering)
  test('TEST 9: Invoice creation regression -> GST, numbering, and payment tracking all function properly', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Taxable Goods',
      stock_quantity: 50,
      selling_price: 1000
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Client T9',
      billing_address: 'Addr 9',
      shipping_address: 'Addr 9',
      gst_enabled: true,
      gst_rate: 18,
      place_of_supply: 'Karnataka', // Inter-state from Maharashtra -> IGST
      paid_amount: 1180,
      payment_method: 'upi',
      payment_reference: 'UPI-TXN-123456',
      items: [{ product_id: product.id, quantity: 1, unit_price: 1000 }]
    });

    assert.ok(invoice);
    assert.equal(invoice.invoice_number.startsWith('STK-'), true);
    assert.equal(Number(invoice.subtotal), 1000);
    assert.equal(Number(invoice.igst_amount), 180);
    assert.equal(Number(invoice.total_amount), 1180);
    assert.equal(Number(invoice.paid_amount), 1180);
    assert.equal(invoice.payment_status, 'paid');
    assert.equal(invoice.payments.length, 1);
    assert.equal(invoice.payments[0].payment_reference, 'UPI-TXN-123456');

    const reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 49);
  });

  // TEST 10: Stock reversal on invoice deletion
  test('TEST 10: Invoice deletion safely restores product stock', async () => {
    const product = await Product.create({
      company_id: companyA.id,
      product_name: 'Restorable Item',
      stock_quantity: 50,
      selling_price: 100
    });

    const invoice = await invoiceService.generateInvoice(userA.id, {
      customer_mobile: '9876543210',
      customer_name: 'Client T10',
      billing_address: 'Addr 10',
      shipping_address: 'Addr 10',
      items: [{ product_id: product.id, quantity: 5, unit_price: 100 }]
    });

    let reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 45); // Decremented

    // Now delete invoice
    const deleted = await invoiceService.deleteInvoice(userA.id, invoice.id);
    assert.equal(deleted, true);

    reloaded = await Product.findByPk(product.id);
    assert.equal(reloaded.stock_quantity, 50); // Fully restored!
  });
});
