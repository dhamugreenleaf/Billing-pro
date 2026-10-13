import crypto from 'crypto';
import razorpay from '../../../config/razorpay.js';
import * as subService from '../services/subscription.service.js';
import * as planRepo from '../repository/plan.repository.js';
import InvoiceFormat from '../../invoice/model/invoiceFormat.model.js';

export const getCurrentSubscription = async (req, res, next) => {
  try {
    const sub = await subService.getCurrentSubscription(req.user.id);
    res.status(200).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await planRepo.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (plan.price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid plan price for Razorpay' });
    }

    // Determine if we need an Order (one-time) or a Subscription (recurring)
    if (plan.billing_cycle === 'monthly' || plan.billing_cycle === 'yearly') {
      const rpPlan = await subService.getOrCreateRazorpayPlan(plan);
      
      const options = {
        plan_id: rpPlan.id,
        total_count: 120, // 10 years by default for 'forever' style subscriptions
        customer_notify: 1,
        notes: {
          user_id: req.user.id,
          plan_id: planId
        }
      };

      const subscription = await razorpay.subscriptions.create(options);
      
      return res.status(200).json({ 
        success: true, 
        data: {
          subscription_id: subscription.id,
          order_id: null,
          key_id: process.env.RAZORPAY_KEY_ID
        } 
      });
    } else {
      // One-time order flow (e.g. for ₹1 test plan if we set billing_cycle to something else, or if forever)
      const options = {
        amount: Math.round(plan.price * 100), // amount in the smallest currency unit
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          user_id: req.user.id,
          plan_id: planId
        }
      };

      const order = await razorpay.orders.create(options);
      
      return res.status(200).json({ 
        success: true, 
        data: {
          order_id: order.id,
          subscription_id: null,
          amount: order.amount,
          currency: order.currency,
          key_id: process.env.RAZORPAY_KEY_ID
        } 
      });
    }
  } catch (error) {
    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_subscription_id,
      razorpay_payment_id, 
      razorpay_signature,
      planId
    } = req.body;

    let body;
    if (razorpay_subscription_id) {
      body = razorpay_payment_id + "|" + razorpay_subscription_id;
    } else {
      body = razorpay_order_id + "|" + razorpay_payment_id;
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Payment is verified, create the subscription
    // Pass the subscription ID if it's recurring, otherwise pass the payment ID
    const paymentData = { reference: razorpay_subscription_id || razorpay_payment_id };
    const sub = await subService.purchaseSubscription(req.user.id, planId, paymentData);
    
    res.status(200).json({ success: true, data: sub, message: 'Subscription activated successfully' });
  } catch (error) {
    next(error);
  }
};

export const activateTestPro = async (req, res, next) => {
  try {
    const targetName = req.body?.planName || req.query?.plan || 'Pro';
    const plans = await planRepo.getAllPlans({ name: targetName });
    if (!plans || plans.length === 0) {
      return res.status(404).json({ success: false, message: `${targetName} plan not found` });
    }
    const selectedPlan = plans[0];
    const sub = await subService.purchaseSubscription(req.user.id, selectedPlan.id, { reference: 'test_' + targetName.toLowerCase() + '_' + Date.now() });
    res.status(200).json({ success: true, data: sub, message: `${targetName} plan activated successfully` });
  } catch (error) {
    next(error);
  }
};


export const getInvoiceFormatsAvailability = async (req, res, next) => {
  try {
    const formats = await InvoiceFormat.findAll({ where: { status: 'active' } });
    const isAdmin = req.user && req.user.role === 'admin';
    const sub = await subService.getCurrentSubscription(req.user.id);
    const planName = sub && sub.Plan ? sub.Plan.name : 'Free';
    
    // Simplistic entitlement logic mapping plan names to a hierarchy
    const planLevels = { 'Free': 1, 'Basic': 2, 'Pro': 3, 'Enterprise': 4 };
    const currentLevel = planLevels[planName] || 1;

    const data = formats.map(f => {
      const requiredPlanName = f.required_plan || 'Free';
      const requiredLevel = planLevels[requiredPlanName] || 1;

      return {
        id: f.id,
        name: f.name,
        template_identifier: f.template_identifier,
        required_plan: requiredPlanName,
        available: true // TEMPORARY FOR TESTING: All invoice formats open
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getAllInvoiceFormats = async (req, res, next) => {
  try {
    const formats = await InvoiceFormat.findAll();
    res.status(200).json({ success: true, data: formats });
  } catch (error) {
    next(error);
  }
};

export const updateInvoiceFormatStatus = async (req, res, next) => {
  try {
    const format = await InvoiceFormat.findByPk(req.params.id);
    if (!format) {
      return res.status(404).json({ success: false, message: 'Format not found' });
    }
    format.status = req.body.status;
    await format.save();
    res.status(200).json({ success: true, data: format, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

export const verifyWebhookSignature = (rawPayload, signature, secret) => {
  if (!signature || typeof signature !== 'string' || signature.trim() === '') {
    return false;
  }
  if (!secret || typeof secret !== 'string' || secret.trim() === '') {
    return false;
  }
  if (!rawPayload || (typeof rawPayload !== 'string' && !Buffer.isBuffer(rawPayload))) {
    return false;
  }

  try {
    const cleanSignature = signature.trim();
    if (cleanSignature.length !== 64) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    const signatureBuffer = Buffer.from(cleanSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length || signatureBuffer.length === 0) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  } catch (err) {
    return false;
  }
};

export const handleWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    // 1. Mandatory Fail-Closed Webhook Signature Verification
    const isSignatureValid = verifyWebhookSignature(rawPayload, signature, secret);

    if (!isSignatureValid) {
      console.warn('[Razorpay Webhook] Signature verification failed');
      return res.status(400).json({
        success: false,
        message: 'Webhook verification failed'
      });
    }

    // 2. Parse & Validate Event Payload
    let event = req.body;
    if (typeof event === 'string') {
      try {
        event = JSON.parse(event);
      } catch (parseErr) {
        console.warn('[Razorpay Webhook] Malformed JSON event payload');
        return res.status(400).json({
          success: false,
          message: 'Invalid webhook payload structure'
        });
      }
    }

    if (!event || typeof event !== 'object' || !event.event) {
      console.warn('[Razorpay Webhook] Missing event type in payload');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook event format'
      });
    }

    // 3. Process Verified Event Handlers with Idempotency
    // One-time payment handlers
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (paymentEntity) {
        const reference = paymentEntity.id;
        if (reference) {
          const existingSub = await subService.getSubscriptionByReference(reference);
          if (existingSub) {
            console.log(`[Razorpay Webhook] Payment ${reference} already processed. Skipping duplicate.`);
            return res.status(200).send('OK');
          }
        }

        const notes = paymentEntity.notes || {};
        const { user_id, plan_id, invoice_id, company_id } = notes;

        if (invoice_id) {
          try {
            const Invoice = (await import('../../invoice/model/invoice.model.js')).default;
            const paymentRepo = await import('../../invoice/repository/payment.repository.js');
            const invId = parseInt(invoice_id, 10);
            const invoice = await Invoice.findByPk(invId);
            if (invoice) {
              const compId = company_id ? parseInt(company_id, 10) : invoice.company_id;
              if (compId === invoice.company_id) {
                const payAmount = paymentEntity.amount !== undefined ? (paymentEntity.amount / 100) : parseFloat(invoice.total_amount);
                await paymentRepo.recordPayment({
                  company_id: compId,
                  invoice_id: invId,
                  amount: payAmount,
                  payment_method: 'razorpay',
                  payment_reference: reference || null,
                  notes: `Razorpay payment ${reference || ''}`.trim()
                });
              }
            }
          } catch (payErr) {
            console.error('[Razorpay Webhook] Error recording invoice payment:', payErr.message || payErr);
          }
        } else if (user_id && plan_id) {
          const paymentData = { reference };
          await subService.purchaseSubscription(user_id, plan_id, paymentData);
        }
      }
    }

    // Subscription handlers
    if (event.event === 'subscription.charged' || event.event === 'subscription.activated') {
      const subEntity = event.payload?.subscription?.entity;
      if (subEntity) {
        const reference = subEntity.id;
        if (reference) {
          const existingSub = await subService.getSubscriptionByReference(reference);
          if (existingSub) {
            console.log(`[Razorpay Webhook] Subscription ${reference} already processed. Updating cycle.`);
            if (subEntity.current_end) {
              existingSub.end_date = new Date(subEntity.current_end * 1000);
              existingSub.status = 'active';
              await existingSub.save();
            }
            return res.status(200).send('OK');
          }
        }

        const notes = subEntity.notes || {};
        const { user_id, plan_id } = notes;

        if (user_id && plan_id) {
          const paymentData = { reference };
          const sub = await subService.purchaseSubscription(user_id, plan_id, paymentData);
          if (subEntity.current_end) {
            sub.end_date = new Date(subEntity.current_end * 1000);
            sub.status = 'active';
            await sub.save();
          }
        }
      }
    }

    if (event.event === 'subscription.halted' || event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      const subEntity = event.payload?.subscription?.entity;
      if (subEntity?.id) {
        const dbSub = await subService.getSubscriptionByReference(subEntity.id);
        if (dbSub) {
          dbSub.status = event.event === 'subscription.cancelled' ? 'cancelled' : 'expired';
          await dbSub.save();
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('[Razorpay Webhook] Processing error:', error.message || error);
    return res.status(400).json({
      success: false,
      message: 'Webhook processing error'
    });
  }
};

