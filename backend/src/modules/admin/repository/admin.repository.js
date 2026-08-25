import { Op } from 'sequelize';
import User from '../../auth/model/auth.model.js';
import Company from '../../company/model/company.model.js';
import Invoice from '../../invoice/model/invoice.model.js';
import Subscription from '../../subscription/model/subscription.model.js';
import Plan from '../../subscription/model/plan.model.js';

export const getDashboardMetrics = async () => {
  const totalCustomers = await User.count({ where: { role: 'customer' } });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const customersToday = await User.count({
    where: {
      role: 'customer',
      created_at: { [Op.gte]: today }
    }
  });

  const totalBills = await Invoice.count();
  const thisMonthBills = await Invoice.count({
    where: {
      created_at: { [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    }
  });
  const totalRevenue = await Invoice.sum('total_amount') || 0;

  // Real Paid Users
  const paidUsers = await User.count({
    where: {
      role: 'customer',
      subscription_status: 'paid',
      is_deleted: false
    }
  });

  // Real Monthly Revenue (sum of active subscriptions)
  const monthlyRevenue = await Subscription.sum('amount', {
    where: {
      status: 'active'
    }
  }) || 0;

  return { totalCustomers, customersToday, totalBills, thisMonthBills, totalRevenue, paidUsers, monthlyRevenue };
};

export const getAllCustomers = async () => {
  return await User.findAll({
    where: { 
      role: 'customer',
      is_deleted: false
    },
    include: [
      { model: Company },
      { 
        model: Subscription, 
        where: { status: 'active' },
        required: false,
        include: [{ model: Plan }]
      }
    ],
    order: [['created_at', 'DESC']]
  });
};

export const getCustomerById = async (id) => {
  return await User.findOne({
    where: {
      id,
      is_deleted: false
    }
  });
};

export const deleteCustomer = async (id) => {
  const user = await User.findByPk(id);
  if (user) {
    user.is_deleted = true;
    user.is_active = false;
    await user.save();
    return true;
  }
  return false;
};

// ... other existing exports

import AdminSettings from '../model/adminSettings.model.js';

export const getGlobalSettings = async () => {
  const [settings] = await AdminSettings.findOrCreate({
    where: { id: 1 },
    defaults: {
      default_invoice_format: 'standard',
      default_gst_rate: 18.0,
      tally_format: 'default'
    }
  });
  return settings;
};

export const updateGlobalSettings = async (settingsData) => {
  const settings = await getGlobalSettings();
  return await settings.update(settingsData);
};

export const getCompanyByUserId = async (userId) => {
  return await Company.findOne({ where: { user_id: userId } });
};

export const getInvoiceCountByCompanyId = async (companyId) => {
  return await Invoice.count({ where: { company_id: companyId } });
};

export const getAllCompanies = async () => {
  return await Company.findAll({
    include: [{ model: User, attributes: ['mobile_number', 'is_active'] }],
    order: [['created_at', 'DESC']]
  });
};

export const getAllInvoices = async () => {
  return await Invoice.findAll({
    include: [{ model: Company, attributes: ['company_name', 'owner_name'] }],
    order: [['created_at', 'DESC']],
    limit: 100
  });
};

export const updateAdminProfile = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw { statusCode: 404, message: 'User not found' };
  
  if (data.name !== undefined) user.name = data.name;
  if (data.mobile_number !== undefined) user.mobile_number = data.mobile_number;
  
  await user.save();
  return {
    id: user.id,
    name: user.name,
    mobile_number: user.mobile_number,
    role: user.role
  };
};
