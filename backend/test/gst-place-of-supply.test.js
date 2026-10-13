import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { 
  normalizeState, 
  getStateFromGstin, 
  determineGstClassification, 
  calculateGstSplit,
  roundTo2Decimals
} from '../src/utils/gstState.js';
import * as invoiceService from '../src/modules/invoice/services/invoice.service.js';
import AdminSettings from '../src/modules/admin/model/adminSettings.model.js';
import Company from '../src/modules/company/model/company.model.js';
import Customer from '../src/modules/customer/model/customer.model.js';
import Invoice from '../src/modules/invoice/model/invoice.model.js';
import InvoiceItem from '../src/modules/invoice/model/invoiceItem.model.js';
import Payment from '../src/modules/invoice/model/payment.model.js';
import User from '../src/modules/auth/model/auth.model.js';
import Subscription from '../src/modules/subscription/model/subscription.model.js';
import Plan from '../src/modules/subscription/model/plan.model.js';
import Settings from '../src/modules/settings/model/settings.model.js';

describe('STEP 6 — Dynamic GST Place of Supply & CGST/SGST vs IGST Suite', () => {

  const originalSubscriptionFindOne = Subscription.findOne;
  const originalPlanFindAll = Plan.findAll;
  const originalAdminSettingsFindByPk = AdminSettings.findByPk;
  const originalSettingsFindOne = Settings.findOne;
  const originalSettingsCreate = Settings.create;

  let testUser, testCompany;

  before(async () => {
    // Model mocks for clean service testing
    AdminSettings.findByPk = async () => ({
      default_invoice_format: 'standard',
      default_gst_rate: 18.0
    });

    Subscription.findOne = async () => ({
      id: 1,
      status: 'active',
      Plan: { name: 'Pro' }
    });

    Plan.findAll = async () => [
      { id: 1, name: 'Free' }
    ];

    // Ensure real test fixtures exist in DB for end-to-end integration test
    const rand = Math.floor(Math.random() * 899999 + 100000);
    testUser = await User.create({
      mobile_number: `916${rand}`,
      role: 'customer',
      profile_completed: true
    });
    testCompany = await Company.create({
      user_id: testUser.id,
      company_name: 'Delhi Traders',
      state: 'Delhi',
      gst_number: '07AAAAA0000A1Z5',
      invoice_prefix: 'DL'
    });

    Settings.findOne = async () => ({
      company_id: testCompany.id,
      default_gst_rate: 18.0
    });

    Settings.create = async () => ({
      company_id: testCompany.id,
      default_gst_rate: 18.0
    });
  });

  after(async () => {
    try {
      if (testCompany && testUser) {
        const invIds = (await Invoice.findAll({
          where: { company_id: testCompany.id },
          attributes: ['id']
        })).map(i => i.id);

        if (invIds.length > 0) {
          await Payment.destroy({ where: { invoice_id: invIds } });
          await InvoiceItem.destroy({ where: { invoice_id: invIds } });
          await Invoice.destroy({ where: { id: invIds } });
        }
        await Customer.destroy({ where: { company_id: testCompany.id } });
        await Company.destroy({ where: { id: testCompany.id } });
        await User.destroy({ where: { id: testUser.id } });
      }
    } catch (err) {
      console.warn('Cleanup warning in test suite:', err.message);
    }
    Subscription.findOne = originalSubscriptionFindOne;
    Plan.findAll = originalPlanFindAll;
    AdminSettings.findByPk = originalAdminSettingsFindByPk;
    Settings.findOne = originalSettingsFindOne;
    Settings.create = originalSettingsCreate;
  });

  // TEST 1: Tamil Nadu company + Tamil Nadu customer -> intra-state -> CGST + SGST, IGST = 0
  test('TEST 1: Tamil Nadu company + Tamil Nadu customer -> intra-state (CGST + SGST, IGST = 0)', () => {
    const classification = determineGstClassification('Tamil Nadu', 'Tamil Nadu');
    assert.equal(classification.type, 'INTRA_STATE');
    assert.equal(classification.isInterState, false);

    const split = calculateGstSplit(1000, 18, 'exclusive', classification.type);
    assert.equal(split.cgst_rate, 9);
    assert.equal(split.sgst_rate, 9);
    assert.equal(split.igst_rate, 0);
    assert.equal(split.cgst_amount, 90.00);
    assert.equal(split.sgst_amount, 90.00);
    assert.equal(split.igst_amount, 0.00);
    assert.equal(split.taxAmount, 180.00);
  });

  // TEST 2: Tamil Nadu company + Karnataka customer -> inter-state -> IGST, CGST = 0, SGST = 0
  test('TEST 2: Tamil Nadu company + Karnataka customer -> inter-state (IGST, CGST = 0, SGST = 0)', () => {
    const classification = determineGstClassification('Tamil Nadu', 'Karnataka');
    assert.equal(classification.type, 'INTER_STATE');
    assert.equal(classification.isInterState, true);

    const split = calculateGstSplit(1000, 18, 'exclusive', classification.type);
    assert.equal(split.cgst_rate, 0);
    assert.equal(split.sgst_rate, 0);
    assert.equal(split.igst_rate, 18);
    assert.equal(split.cgst_amount, 0.00);
    assert.equal(split.sgst_amount, 0.00);
    assert.equal(split.igst_amount, 180.00);
    assert.equal(split.taxAmount, 180.00);
  });

  // TEST 3: Karnataka company + Karnataka customer -> intra-state -> CGST + SGST
  test('TEST 3: Karnataka company + Karnataka customer -> intra-state (CGST + SGST)', () => {
    const classification = determineGstClassification('Karnataka', 'Karnataka');
    assert.equal(classification.type, 'INTRA_STATE');
    assert.equal(classification.isInterState, false);

    const split = calculateGstSplit(2000, 18, 'exclusive', classification.type);
    assert.equal(split.cgst_rate, 9);
    assert.equal(split.sgst_rate, 9);
    assert.equal(split.igst_rate, 0);
    assert.equal(split.cgst_amount, 180.00);
    assert.equal(split.sgst_amount, 180.00);
    assert.equal(split.igst_amount, 0.00);
    assert.equal(split.taxAmount, 360.00);
  });

  // TEST 4: Karnataka company + Tamil Nadu customer -> inter-state -> IGST
  test('TEST 4: Karnataka company + Tamil Nadu customer -> inter-state (IGST)', () => {
    const classification = determineGstClassification('Karnataka', 'Tamil Nadu');
    assert.equal(classification.type, 'INTER_STATE');
    assert.equal(classification.isInterState, true);

    const split = calculateGstSplit(2000, 18, 'exclusive', classification.type);
    assert.equal(split.cgst_rate, 0);
    assert.equal(split.sgst_rate, 0);
    assert.equal(split.igst_rate, 18);
    assert.equal(split.cgst_amount, 0.00);
    assert.equal(split.sgst_amount, 0.00);
    assert.equal(split.igst_amount, 360.00);
    assert.equal(split.taxAmount, 360.00);
  });

  // TEST 5: 18% GST intra-state -> 9% CGST + 9% SGST
  test('TEST 5: 18% GST intra-state -> 9% CGST + 9% SGST', () => {
    const split = calculateGstSplit(500, 18, 'exclusive', 'INTRA_STATE');
    assert.equal(split.cgst_rate, 9);
    assert.equal(split.sgst_rate, 9);
    assert.equal(split.igst_rate, 0);
    assert.equal(split.cgst_amount, 45.00);
    assert.equal(split.sgst_amount, 45.00);
    assert.equal(split.igst_amount, 0.00);
    assert.equal(split.taxAmount, 90.00);
  });

  // TEST 6: 18% GST inter-state -> 18% IGST
  test('TEST 6: 18% GST inter-state -> 18% IGST', () => {
    const split = calculateGstSplit(500, 18, 'exclusive', 'INTER_STATE');
    assert.equal(split.cgst_rate, 0);
    assert.equal(split.sgst_rate, 0);
    assert.equal(split.igst_rate, 18);
    assert.equal(split.cgst_amount, 0.00);
    assert.equal(split.sgst_amount, 0.00);
    assert.equal(split.igst_amount, 90.00);
    assert.equal(split.taxAmount, 90.00);
  });

  // TEST 7: 5% GST intra-state -> 2.5% CGST + 2.5% SGST
  test('TEST 7: 5% GST intra-state -> 2.5% CGST + 2.5% SGST', () => {
    const split = calculateGstSplit(1000, 5, 'exclusive', 'INTRA_STATE');
    assert.equal(split.cgst_rate, 2.5);
    assert.equal(split.sgst_rate, 2.5);
    assert.equal(split.igst_rate, 0);
    assert.equal(split.cgst_amount, 25.00);
    assert.equal(split.sgst_amount, 25.00);
    assert.equal(split.igst_amount, 0.00);
    assert.equal(split.taxAmount, 50.00);
  });

  // TEST 8: 5% GST inter-state -> 5% IGST
  test('TEST 8: 5% GST inter-state -> 5% IGST', () => {
    const split = calculateGstSplit(1000, 5, 'exclusive', 'INTER_STATE');
    assert.equal(split.cgst_rate, 0);
    assert.equal(split.sgst_rate, 0);
    assert.equal(split.igst_rate, 5);
    assert.equal(split.cgst_amount, 0.00);
    assert.equal(split.sgst_amount, 0.00);
    assert.equal(split.igst_amount, 50.00);
    assert.equal(split.taxAmount, 50.00);
  });

  // TEST 9: Case/whitespace normalization -> equivalent state values must not incorrectly become interstate
  test('TEST 9: Case and whitespace normalization prevents false interstate classification', () => {
    // Variations of Tamil Nadu
    const res1 = determineGstClassification('Tamil Nadu', '  tamil nadu  ');
    assert.equal(res1.type, 'INTRA_STATE');
    assert.equal(res1.isInterState, false);

    const res2 = determineGstClassification('TN', 'Tamilnadu');
    assert.equal(res2.type, 'INTRA_STATE');
    assert.equal(res2.isInterState, false);

    // Variations of Maharashtra
    const res3 = determineGstClassification('Maharashtra', '  MH ');
    assert.equal(res3.type, 'INTRA_STATE');
    assert.equal(res3.isInterState, false);

    // State code vs state name
    const res4 = determineGstClassification('29', 'Karnataka');
    assert.equal(res4.type, 'INTRA_STATE');
    assert.equal(res4.isInterState, false);

    // State resolved from GSTIN
    const stateFromGstin = getStateFromGstin('33AAAAA0000A1Z5');
    assert.equal(stateFromGstin?.name, 'Tamil Nadu');
    const res5 = determineGstClassification(stateFromGstin.name, '33');
    assert.equal(res5.type, 'INTRA_STATE');
  });

  // TEST 10: Missing/invalid state information -> safe validation/error behavior, never silently assumes Tamil Nadu
  test('TEST 10: Missing/invalid customer state falls back safely to seller state without forcing Tamil Nadu', () => {
    // Seller in Maharashtra, customer state omitted -> defaults to intra-state for seller state (Maharashtra)
    const resMh = determineGstClassification('Maharashtra', null);
    assert.equal(resMh.type, 'INTRA_STATE');
    assert.equal(resMh.sellerState?.name, 'Maharashtra');
    assert.equal(resMh.placeOfSupply, 'Maharashtra');

    // Seller in Karnataka, invalid/unknown string -> defaults safely to intra-state for seller state
    const resKa = determineGstClassification('Karnataka', 'UnknownNonExistentState999');
    assert.equal(resKa.type, 'INTRA_STATE');
    assert.equal(resKa.sellerState?.name, 'Karnataka');
    assert.equal(resKa.placeOfSupply, 'Karnataka');

    // Seller in Gujarat, empty string -> Gujarat
    const resGj = determineGstClassification('Gujarat', '');
    assert.equal(resGj.type, 'INTRA_STATE');
    assert.equal(resGj.sellerState?.name, 'Gujarat');
    assert.equal(resGj.placeOfSupply, 'Gujarat');
    assert.notEqual(resGj.placeOfSupply, 'Tamil Nadu');
  });

  // TEST 11: Invoice total remains correct after GST classification (2-decimal precision)
  test('TEST 11: Invoice total remains correct with 2-decimal precision (exclusive and inclusive)', () => {
    // Exclusive test: 1234.56 subtotal with 18% GST intra-state
    const exclIntra = calculateGstSplit(1234.56, 18, 'exclusive', 'INTRA_STATE');
    assert.equal(exclIntra.taxableAmount, 1234.56);
    assert.equal(exclIntra.cgst_amount, 111.11);
    assert.equal(exclIntra.sgst_amount, 111.11);
    assert.equal(exclIntra.taxAmount, 222.22);
    const totalExcl = roundTo2Decimals(exclIntra.taxableAmount + exclIntra.taxAmount);
    assert.equal(totalExcl, 1456.78);

    // Inclusive test: 1000 total with 18% GST inter-state
    const inclInter = calculateGstSplit(1000, 18, 'inclusive', 'INTER_STATE');
    assert.equal(inclInter.taxableAmount, 847.46);
    assert.equal(inclInter.igst_amount, 152.54);
    assert.equal(inclInter.cgst_amount, 0);
    assert.equal(inclInter.sgst_amount, 0);
    assert.equal(inclInter.taxAmount, 152.54);
    assert.equal(roundTo2Decimals(inclInter.taxableAmount + inclInter.taxAmount), 1000.00);
  });

  // TEST 12: Existing invoice creation flow still works dynamically end-to-end
  test('TEST 12: End-to-end invoice creation with dynamic GST classification and multi-tenant isolation', async () => {
    // Test A: Delhi company (testUser.id) + Haryana customer -> INTER-STATE
    const invoiceInter = await invoiceService.generateInvoice(testUser.id, {
      customer_mobile: '9876543210',
      customer_name: 'Haryana Client',
      billing_address: 'Gurgaon, Haryana',
      shipping_address: 'Gurgaon, Haryana',
      gst_enabled: true,
      gst_rate: 18,
      place_of_supply: 'Haryana',
      items: [
        { description: 'Consulting Service', unit_price: 10000, quantity: 1 }
      ]
    });

    assert.equal(invoiceInter.company_id, testCompany.id);
    assert.equal(invoiceInter.place_of_supply, 'Haryana');
    assert.equal(parseFloat(invoiceInter.taxable_amount), 10000.00);
    assert.equal(parseFloat(invoiceInter.igst_rate), 18);
    assert.equal(parseFloat(invoiceInter.igst_amount), 1800.00);
    assert.equal(parseFloat(invoiceInter.cgst_amount), 0);
    assert.equal(parseFloat(invoiceInter.sgst_amount), 0);
    assert.equal(parseFloat(invoiceInter.total_amount), 11800.00);

    // Verify initial payment created and correctly associated
    assert.ok(invoiceInter.payments && invoiceInter.payments.length > 0);
    assert.equal(invoiceInter.payments[0].company_id, testCompany.id);
    assert.equal(invoiceInter.payments[0].invoice_id, invoiceInter.id);
    assert.equal(parseFloat(invoiceInter.payments[0].amount), 11800.00);

    // Test B: Delhi company (testUser.id) + Delhi customer -> INTRA-STATE
    const invoiceIntra = await invoiceService.generateInvoice(testUser.id, {
      customer_mobile: '9876543210',
      customer_name: 'Delhi Client',
      billing_address: 'Connaught Place, Delhi',
      shipping_address: 'Connaught Place, Delhi',
      gst_enabled: true,
      gst_rate: 18,
      place_of_supply: 'Delhi',
      items: [
        { description: 'Local Hardware', unit_price: 5000, quantity: 1 }
      ]
    });

    assert.equal(invoiceIntra.company_id, testCompany.id);
    assert.equal(invoiceIntra.place_of_supply, 'Delhi');
    assert.equal(parseFloat(invoiceIntra.taxable_amount), 5000.00);
    assert.equal(parseFloat(invoiceIntra.cgst_rate), 9);
    assert.equal(parseFloat(invoiceIntra.cgst_amount), 450.00);
    assert.equal(parseFloat(invoiceIntra.sgst_rate), 9);
    assert.equal(parseFloat(invoiceIntra.sgst_amount), 450.00);
    assert.equal(parseFloat(invoiceIntra.igst_amount), 0);
    assert.equal(parseFloat(invoiceIntra.total_amount), 5900.00);

    // Verify initial payment for Test B
    assert.ok(invoiceIntra.payments && invoiceIntra.payments.length > 0);
    assert.equal(invoiceIntra.payments[0].company_id, testCompany.id);
    assert.equal(invoiceIntra.payments[0].invoice_id, invoiceIntra.id);
    assert.equal(parseFloat(invoiceIntra.payments[0].amount), 5900.00);
  });
});
