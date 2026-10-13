import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { handleWebhook, verifyWebhookSignature, verifyPayment } from '../src/modules/subscription/controller/subscription.controller.js';
import Subscription from '../src/modules/subscription/model/subscription.model.js';
import Plan from '../src/modules/subscription/model/plan.model.js';
import User from '../src/modules/auth/model/auth.model.js';

describe('Razorpay Webhook Security & Fail-Closed Suite', () => {
  const originalEnv = { ...process.env };
  const TEST_WEBHOOK_SECRET = 'test_whsec_999888777666555444333222111000aa';
  const TEST_KEY_SECRET = 'test_rzp_secret_abcdef123456';

  let subscriptionCreatedCount = 0;
  let lastCreatedSubscription = null;

  const originalPlanFindByPk = Plan.findByPk;
  const originalSubFindOne = Subscription.findOne;
  const originalSubCreate = Subscription.create;
  const originalUserFindByPk = User.findByPk;

  const createMockRes = () => {
    let statusCode = 200;
    let resBody = null;
    return {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        resBody = data;
        return this;
      },
      send(data) {
        resBody = data;
        return this;
      },
      getStatusCode: () => statusCode,
      getBody: () => resBody
    };
  };

  before(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
    process.env.RAZORPAY_KEY_SECRET = TEST_KEY_SECRET;

    Plan.findByPk = async (id) => ({
      id,
      name: 'Pro Monthly',
      price: 499,
      status: 'active',
      billing_cycle: 'monthly'
    });

    Subscription.findOne = async () => null;

    Subscription.create = async (data) => {
      subscriptionCreatedCount++;
      lastCreatedSubscription = { id: 101, ...data };
      return lastCreatedSubscription;
    };

    User.findByPk = async () => ({
      id: 1,
      subscription_status: 'free',
      save: async () => {}
    });
  });

  after(() => {
    process.env = originalEnv;
    Plan.findByPk = originalPlanFindByPk;
    Subscription.findOne = originalSubFindOne;
    Subscription.create = originalSubCreate;
    User.findByPk = originalUserFindByPk;
  });

  test('TEST 1: Valid signature + valid payload -> 200 OK and business logic executes', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_001',
            notes: {
              user_id: 1,
              plan_id: 2
            }
          }
        }
      }
    };

    const rawPayload = JSON.stringify(payloadObj);
    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    const req = {
      headers: {
        'x-razorpay-signature': validSignature
      },
      rawBody: rawPayload,
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 200);
    assert.equal(subscriptionCreatedCount, 1);
    assert.equal(lastCreatedSubscription.payment_reference, 'pay_test_001');
  });

  test('TEST 2: Missing x-razorpay-signature header -> 400 and NO business logic executed', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_test_002', notes: { user_id: 1, plan_id: 2 } }
        }
      }
    };

    const req = {
      headers: {}, // No signature header
      rawBody: JSON.stringify(payloadObj),
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 3: Empty signature string -> 400 and NO business logic executed', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_test_003', notes: { user_id: 1, plan_id: 2 } }
        }
      }
    };

    const req = {
      headers: {
        'x-razorpay-signature': '   '
      },
      rawBody: JSON.stringify(payloadObj),
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 4: Tampered / Invalid signature -> 400 and NO business logic executed', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_test_004', notes: { user_id: 1, plan_id: 2 } }
        }
      }
    };

    const fakeSignature = 'a'.repeat(64); // 64 hex chars but incorrect digest

    const req = {
      headers: {
        'x-razorpay-signature': fakeSignature
      },
      rawBody: JSON.stringify(payloadObj),
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 5: Wrong webhook secret used for signature -> 400 and NO business logic executed', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_test_005', notes: { user_id: 1, plan_id: 2 } }
        }
      }
    };

    const rawPayload = JSON.stringify(payloadObj);
    const signatureFromWrongSecret = crypto
      .createHmac('sha256', 'completely_different_attacker_secret')
      .update(rawPayload)
      .digest('hex');

    const req = {
      headers: {
        'x-razorpay-signature': signatureFromWrongSecret
      },
      rawBody: rawPayload,
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 6: Missing RAZORPAY_WEBHOOK_SECRET environment variable -> 400 fail-closed', async () => {
    subscriptionCreatedCount = 0;
    const previousSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    delete process.env.RAZORPAY_WEBHOOK_SECRET;

    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: { id: 'pay_test_006', notes: { user_id: 1, plan_id: 2 } }
        }
      }
    };

    const req = {
      headers: {
        'x-razorpay-signature': 'b'.repeat(64)
      },
      rawBody: JSON.stringify(payloadObj),
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);

    // Restore
    process.env.RAZORPAY_WEBHOOK_SECRET = previousSecret;
  });

  test('TEST 7: Malformed payload / non-JSON event -> safely rejected without 500 or state change', async () => {
    subscriptionCreatedCount = 0;
    const malformedRawBody = '{ invalid: json content';
    const signature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(malformedRawBody)
      .digest('hex');

    const req = {
      headers: {
        'x-razorpay-signature': signature
      },
      rawBody: malformedRawBody,
      body: malformedRawBody
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 8: Signature verification throws unexpected error -> clean 400 fail-closed', async () => {
    subscriptionCreatedCount = 0;
    // Malformed non-hex or invalid input causing verification error
    const req = {
      headers: {
        'x-razorpay-signature': 'not_valid_hex_string_123'
      },
      rawBody: '{"event":"test"}',
      body: { event: 'test' }
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 400);
    assert.equal(res.getBody()?.message, 'Webhook verification failed');
    assert.equal(subscriptionCreatedCount, 0);
  });

  test('TEST 9: Valid signature but unknown / unexpected event type -> safely ignored, 0 state change', async () => {
    subscriptionCreatedCount = 0;
    const payloadObj = {
      event: 'unknown.custom.unhandled_event',
      payload: {
        payment: { entity: { id: 'pay_unhandled_99' } }
      }
    };

    const rawPayload = JSON.stringify(payloadObj);
    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    const req = {
      headers: {
        'x-razorpay-signature': validSignature
      },
      rawBody: rawPayload,
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 200);
    assert.equal(subscriptionCreatedCount, 0); // No state change for unhandled event
  });

  test('TEST 10: Existing valid Razorpay payment flow (verifyPayment) still works normally', async () => {
    subscriptionCreatedCount = 0;
    const orderId = 'order_test_12345';
    const paymentId = 'pay_test_67890';
    const signatureBody = orderId + '|' + paymentId;
    const authenticSignature = crypto
      .createHmac('sha256', TEST_KEY_SECRET)
      .update(signatureBody)
      .digest('hex');

    const req = {
      user: { id: 1 },
      body: {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: authenticSignature,
        planId: 2
      }
    };

    const res = createMockRes();
    await verifyPayment(req, res, () => {});

    assert.equal(res.getStatusCode(), 200);
    assert.equal(res.getBody()?.success, true);
    assert.equal(subscriptionCreatedCount, 1);
  });

  test('TEST 11 (RAW BODY TEST): Exact byte-level raw request body is verified', async () => {
    // White-space and key order differences in JSON produce different HMAC signatures
    const rawBodyA = '{"b":2,"a":1}';
    const rawBodyB = '{"a":1,"b":2}';

    const signatureA = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawBodyA)
      .digest('hex');

    // Matching raw payload succeeds
    assert.ok(verifyWebhookSignature(rawBodyA, signatureA, TEST_WEBHOOK_SECRET));

    // Reordered payload fails verification even if JSON.parse produces equivalent objects
    assert.ok(!verifyWebhookSignature(rawBodyB, signatureA, TEST_WEBHOOK_SECRET));
  });

  test('TEST 12 (IDEMPOTENCY): Duplicate webhook for already processed payment returns 200 without duplicate creation', async () => {
    subscriptionCreatedCount = 0;
    const duplicatePaymentRef = 'pay_already_processed_999';

    // Mock Subscription.findOne to return existing subscription for duplicatePaymentRef
    Subscription.findOne = async ({ where }) => {
      if (where?.payment_reference === duplicatePaymentRef) {
        return { id: 88, payment_reference: duplicatePaymentRef, status: 'active' };
      }
      return null;
    };

    const payloadObj = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: duplicatePaymentRef,
            notes: { user_id: 1, plan_id: 2 }
          }
        }
      }
    };

    const rawPayload = JSON.stringify(payloadObj);
    const validSignature = crypto
      .createHmac('sha256', TEST_WEBHOOK_SECRET)
      .update(rawPayload)
      .digest('hex');

    const req = {
      headers: {
        'x-razorpay-signature': validSignature
      },
      rawBody: rawPayload,
      body: payloadObj
    };

    const res = createMockRes();
    await handleWebhook(req, res, () => {});

    assert.equal(res.getStatusCode(), 200);
    assert.equal(subscriptionCreatedCount, 0); // Idempotent: Did NOT create duplicate subscription!

    // Reset Subscription.findOne
    Subscription.findOne = async () => null;
  });
});
