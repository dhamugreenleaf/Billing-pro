import Subscription from '../model/subscription.model.js';
import Plan from '../model/plan.model.js';
import { Op } from 'sequelize';

export const createSubscription = async (data) => {
  return await Subscription.create(data);
};

export const getSubscriptionByUserId = async (userId) => {
  return await Subscription.findOne({
    where: { 
      user_id: userId,
      status: 'active',
      [Op.or]: [
        { end_date: { [Op.gt]: new Date() } },
        { end_date: null } // forever plan
      ]
    },
    include: [{ model: Plan }],
    order: [['created_at', 'DESC']]
  });
};

export const getSubscriptionByReference = async (reference) => {
  return await Subscription.findOne({
    where: { payment_reference: reference }
  });
};

export const updateSubscription = async (id, data) => {
  const sub = await Subscription.findByPk(id);
  if (!sub) return null;
  return await sub.update(data);
};

export const cancelSubscription = async (id) => {
  const sub = await Subscription.findByPk(id);
  if (!sub) return null;
  return await sub.update({ status: 'cancelled' });
};

export const checkExpiredSubscriptions = async () => {
  // Find subscriptions that have passed their end_date and are still marked 'active'
  return await Subscription.update(
    { status: 'expired' },
    { 
      where: { 
        status: 'active',
        end_date: { [Op.lt]: new Date() }
      } 
    }
  );
};
