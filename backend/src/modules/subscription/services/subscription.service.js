import * as subRepo from '../repository/subscription.repository.js';
import * as planRepo from '../repository/plan.repository.js';
import User from '../../auth/model/auth.model.js';
import razorpay from '../../../config/razorpay.js';

export const getCurrentSubscription = async (userId) => {
  let sub = await subRepo.getSubscriptionByUserId(userId);
  
  // If no active subscription, implicitly they are on Free if a free plan exists
  if (!sub) {
    const plans = await planRepo.getAllPlans({ name: 'Free' });
    if (plans.length > 0) {
      const freePlan = plans[0];
      return {
        isImplicit: true,
        Plan: freePlan,
        status: 'active'
      };
    }
    return null;
  }
  return sub;
};

export const getSubscriptionByReference = async (reference) => {
  return await subRepo.getSubscriptionByReference(reference);
};

export const getOrCreateRazorpayPlan = async (plan) => {
  // Try to find the existing plan on Razorpay
  const rpPlans = await razorpay.plans.all();
  let rpPlan = rpPlans.items.find(p => p.item.name === plan.name && p.item.amount === Math.round(plan.price * 100));
  
  if (!rpPlan) {
    // Create it on Razorpay
    let period = "monthly";
    if (plan.billing_cycle === 'yearly') period = "yearly";
    
    rpPlan = await razorpay.plans.create({
      period: period,
      interval: 1,
      item: {
        name: plan.name,
        amount: Math.round(plan.price * 100),
        currency: "INR",
        description: plan.description || "Recurring Subscription"
      }
    });
  }
  return rpPlan;
};

export const purchaseSubscription = async (userId, planId, paymentData) => {
  const plan = await planRepo.getPlanById(planId);
  if (!plan) throw { statusCode: 404, message: 'Plan not found' };
  if (plan.status !== 'active') throw { statusCode: 400, message: 'Plan is no longer active' };

  // Determine end date
  let endDate = null;
  if (plan.billing_cycle === 'monthly') {
    endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.billing_cycle === 'yearly') {
    endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  // Deactivate existing active subscriptions
  const currentSub = await subRepo.getSubscriptionByUserId(userId);
  if (currentSub && !currentSub.isImplicit) {
    await subRepo.cancelSubscription(currentSub.id);
  }

  // Create new subscription
  const sub = await subRepo.createSubscription({
    user_id: userId,
    plan_id: plan.id,
    status: 'active',
    start_date: new Date(),
    end_date: endDate,
    amount: plan.price,
    payment_reference: paymentData.reference || 'mock_ref_' + Date.now()
  });

  // Update user subscription status
  const user = await User.findByPk(userId);
  if (user) {
    user.subscription_status = plan.price > 0 ? 'paid' : 'free';
    await user.save();
  }

  return sub;
};
