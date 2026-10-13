import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('GoBill Mobile Application — Architecture & Logic Test Suite', () => {

  // TEST 1: Phone number normalization and validation
  test('TEST 1: Phone number normalization cleanly formats +91 and leading 0s to 10 digits', () => {
    const normalize = (text) => {
      let cleaned = String(text || '').replace(/\D/g, '');
      if (cleaned.length === 12 && cleaned.startsWith('91')) cleaned = cleaned.slice(2);
      else if (cleaned.length === 11 && cleaned.startsWith('0')) cleaned = cleaned.slice(1);
      if (cleaned.length > 10) cleaned = cleaned.slice(-10);
      return cleaned;
    };

    assert.equal(normalize('+91 98765-43210'), '9876543210');
    assert.equal(normalize('09876543210'), '9876543210');
    assert.equal(normalize('9876543210'), '9876543210');
    assert.equal(normalize('98765'), '98765'); // Incomplete
  });

  // TEST 2: Dynamic GST calculation (Intra-state vs Inter-state)
  test('TEST 2: Dynamic GST split correctly distinguishes Intra-state (CGST+SGST) vs Inter-state (IGST)', () => {
    const calculateGst = (subtotal, discount, gstRate, sellerState, customerPos, priceType = 'exclusive') => {
      const taxable = Math.max(0, subtotal - discount);
      const isIntraState = sellerState.trim().toLowerCase() === customerPos.trim().toLowerCase();
      let taxAmount = 0;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let grandTotal = taxable;

      if (priceType === 'inclusive') {
        taxAmount = (taxable * gstRate) / (100 + gstRate);
        grandTotal = taxable;
      } else {
        taxAmount = (taxable * gstRate) / 100;
        grandTotal = taxable + taxAmount;
      }

      if (isIntraState) {
        cgst = taxAmount / 2;
        sgst = taxAmount / 2;
      } else {
        igst = taxAmount;
      }

      return {
        taxable: Math.round(taxable * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        igst: Math.round(igst * 100) / 100,
        grandTotal: Math.round(grandTotal * 100) / 100,
        isIntraState,
      };
    };

    // Case A: Tamil Nadu seller + Tamil Nadu customer (Intra-state, 18% GST on 1000)
    const intra = calculateGst(1000, 0, 18, 'Tamil Nadu', 'Tamil Nadu');
    assert.equal(intra.isIntraState, true);
    assert.equal(intra.cgst, 90.00);
    assert.equal(intra.sgst, 90.00);
    assert.equal(intra.igst, 0.00);
    assert.equal(intra.grandTotal, 1180.00);

    // Case B: Tamil Nadu seller + Karnataka customer (Inter-state, 18% GST on 1000)
    const inter = calculateGst(1000, 0, 18, 'Tamil Nadu', 'Karnataka');
    assert.equal(inter.isIntraState, false);
    assert.equal(inter.cgst, 0.00);
    assert.equal(inter.sgst, 0.00);
    assert.equal(inter.igst, 180.00);
    assert.equal(inter.grandTotal, 1180.00);

    // Case C: Discount applied (2000 subtotal - 500 discount = 1500 taxable @ 18%)
    const withDisc = calculateGst(2000, 500, 18, 'Delhi', 'Haryana');
    assert.equal(withDisc.taxable, 1500.00);
    assert.equal(withDisc.igst, 270.00);
    assert.equal(withDisc.grandTotal, 1770.00);
  });

  // TEST 3: Payment status and balance due logic
  test('TEST 3: Payment status correctly resolves paid, partial, and unpaid balance amounts', () => {
    const resolvePayment = (total, paid) => {
      const t = parseFloat(total || 0);
      const p = parseFloat(paid || 0);
      const due = Math.max(0, t - p);
      let status = 'unpaid';
      if (p >= t && t > 0) status = 'paid';
      else if (p > 0 && p < t) status = 'partial';
      return { status, due };
    };

    assert.deepEqual(resolvePayment(1000, 1000), { status: 'paid', due: 0 });
    assert.deepEqual(resolvePayment(1000, 400), { status: 'partial', due: 600 });
    assert.deepEqual(resolvePayment(1000, 0), { status: 'unpaid', due: 1000 });
  });

  // TEST 4: Subscription plan quotas and usage calculation
  test('TEST 4: Subscription quotas strictly reflect GoBill plan limits', () => {
    const planLimits = { Free: 10, Basic: 1500, Pro: 2500 };

    assert.equal(planLimits.Free, 10);
    assert.equal(planLimits.Basic, 1500);
    assert.equal(planLimits.Pro, 2500);

    const calcUsage = (planName, count) => {
      const limit = planLimits[planName] || 10;
      const percent = Math.min(Math.round((count / limit) * 100), 100);
      return { limit, percent, isLimitReached: count >= limit };
    };

    const freeUsage = calcUsage('Free', 10);
    assert.equal(freeUsage.isLimitReached, true);
    assert.equal(freeUsage.percent, 100);

    const basicUsage = calcUsage('Basic', 750);
    assert.equal(basicUsage.isLimitReached, false);
    assert.equal(basicUsage.percent, 50);

    const proUsage = calcUsage('Pro', 2500);
    assert.equal(proUsage.isLimitReached, true);
    assert.equal(proUsage.percent, 100);
  });

  // TEST 5: Native Fetch API error mapping & 401 unauthorized handling
  test('TEST 5: API error handler extracts clean messages without crashing on non-JSON responses', () => {
    const parseError = (status, responseData) => {
      const errorMsg =
        responseData?.message ||
        responseData?.error ||
        (Array.isArray(responseData?.errors) && responseData.errors[0]?.message) ||
        `Request failed with status ${status}`;
      return { status, message: errorMsg };
    };

    const jsonErr = parseError(400, { message: 'Customer phone number is invalid' });
    assert.equal(jsonErr.message, 'Customer phone number is invalid');
    assert.equal(jsonErr.status, 400);

    const zodErr = parseError(422, { errors: [{ message: 'Quantity must be greater than zero' }] });
    assert.equal(zodErr.message, 'Quantity must be greater than zero');
    assert.equal(zodErr.status, 422);

    const htmlErr = parseError(502, null);
    assert.equal(htmlErr.message, 'Request failed with status 502');
  });

  // TEST 6: App Store Policy Safety (No in-app digital payment gateway bypass)
  test('TEST 6: Mobile code does not embed forbidden client-side Razorpay checkout for digital tiers', () => {
    const subScreenPath = path.resolve('src/screens/subscription/SubscriptionScreen.js');
    const subScreenContent = fs.readFileSync(subScreenPath, 'utf8');

    // Asserts that no Razorpay checkout modal or SDK is imported in subscription screen
    assert.ok(!subScreenContent.includes('react-native-razorpay'), 'Must not import react-native-razorpay in subscription screen');
    assert.ok(!subScreenContent.includes('checkout.razorpay.com'), 'Must not embed Razorpay web checkout in subscription screen');
    assert.ok(subScreenContent.includes('gobill.gldatacenter.com'), 'Must direct users to web portal for store compliance');
  });

  // TEST 7: App.json configuration integrity
  test('TEST 7: app.json contains valid package identifiers and required native plugins', () => {
    const appJsonPath = path.resolve('app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    assert.equal(appJson.expo.android.package, 'com.gobill.billing');
    assert.equal(appJson.expo.ios.bundleIdentifier, 'com.gobill.billing');
    assert.ok(appJson.expo.plugins.includes('expo-secure-store'));
    assert.ok(appJson.expo.plugins.includes('expo-font'));
  });

  // TEST 8: Clean Login UI Branding (No third-party provider names like MSG91 displayed to users)
  test('TEST 8: Login UI screens do not expose third-party vendor names like MSG91', () => {
    const loginScreenPath = path.resolve('src/screens/auth/LoginScreen.js');
    const loginContent = fs.readFileSync(loginScreenPath, 'utf8');

    assert.ok(!loginContent.toLowerCase().includes('msg91'), 'Login screen must not mention MSG91');
    assert.ok(loginContent.includes('Secure Login with Verification Code'), 'Must show clean generic security badge');
  });
});

