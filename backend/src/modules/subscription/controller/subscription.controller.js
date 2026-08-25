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

export const getInvoiceFormatsAvailability = async (req, res, next) => {
  try {
    const formats = await InvoiceFormat.findAll({ where: { status: 'active' } });
    const sub = await subService.getCurrentSubscription(req.user.id);
    const planName = sub && sub.Plan ? sub.Plan.name : 'Free';
    
    // Simplistic entitlement logic mapping plan names to a hierarchy
    const planLevels = { 'Free': 1, 'Basic': 2, 'Pro': 3, 'Enterprise': 4 };
    const currentLevel = planLevels[planName] || 1;

    const data = formats.map(f => {
      let requiredLevel = 3; // Default to Pro
      let requiredPlanName = 'Pro';

      if (f.template_identifier === 'standard' || f.template_identifier === 'tally') {
        requiredLevel = 1; // Free
        requiredPlanName = 'Free';
      } else if (f.template_identifier === 'classic' || f.template_identifier === 'wholesale') {
        requiredLevel = 2; // Basic
        requiredPlanName = 'Basic';
      }

      return {
        id: f.id,
        name: f.name,
        template_identifier: f.template_identifier,
        required_plan: requiredPlanName,
        available: currentLevel >= requiredLevel
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

export const handleWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');
        
      if (expectedSignature !== signature) {
        return res.status(400).json({ success: false, message: 'Invalid signature' });
      }
    }

    const event = req.body;
    
    // Existing one-time order handler
    if (event.event === 'order.paid' || event.event === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const { user_id, plan_id } = notes;
      
      if (user_id && plan_id) {
        const paymentData = { reference: paymentEntity.id };
        await subService.purchaseSubscription(user_id, plan_id, paymentData);
      }
    }
    
    // Subscription handlers
    if (event.event === 'subscription.charged' || event.event === 'subscription.activated') {
      const subEntity = event.payload.subscription.entity;
      const notes = subEntity.notes || {};
      const { user_id, plan_id } = notes;
      
      if (user_id && plan_id) {
        const paymentData = { reference: subEntity.id };
        const sub = await subService.purchaseSubscription(user_id, plan_id, paymentData);
        // Ensure end date aligns with Razorpay's current cycle end
        if (subEntity.current_end) {
          sub.end_date = new Date(subEntity.current_end * 1000);
          sub.status = 'active';
          await sub.save();
        }
      }
    }
    
    if (event.event === 'subscription.halted' || event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      const subEntity = event.payload.subscription.entity;
      // We can look up by payment_reference
      const dbSub = await subService.getSubscriptionByReference(subEntity.id);
      if (dbSub) {
        dbSub.status = event.event === 'subscription.cancelled' ? 'cancelled' : 'expired';
        await dbSub.save();
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook Error');
  }
};

