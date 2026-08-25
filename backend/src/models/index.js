import sequelize from '../config/db.js';

// Import all models here so they get registered with Sequelize
import User from '../modules/auth/model/auth.model.js';
import Company from '../modules/company/model/company.model.js';
import Customer from '../modules/customer/model/customer.model.js';
import Invoice from '../modules/invoice/model/invoice.model.js';
import InvoiceItem from '../modules/invoice/model/invoiceItem.model.js';
import Settings from '../modules/settings/model/settings.model.js';
import AdminSettings from '../modules/admin/model/adminSettings.model.js';
import Plan from '../modules/subscription/model/plan.model.js';
import Subscription from '../modules/subscription/model/subscription.model.js';
import InvoiceFormat from '../modules/invoice/model/invoiceFormat.model.js';

export const syncDatabase = async () => {
  try {
    // In production, migrations should be used instead of alter/force sync
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
    
    // Seed initial data
    await seedInitialData();
  } catch (error) {
    console.error('Error syncing database:', error);
  }
};

const seedInitialData = async () => {
  try {
    // 1. Seed Plans
    const plansCount = await Plan.count();
    if (plansCount === 0) {
      await Plan.bulkCreate([
        {
          name: 'Free',
          price: 0,
          billing_cycle: 'forever',
          description: 'Basic billing functionality for starters.',
          features: ['10 Bills/month', 'Basic Invoicing', 'Standard Templates'],
          status: 'active'
        },
        {
          name: 'Basic',
          price: 1,
          billing_cycle: 'monthly',
          description: 'For customers who need basic billing functionality.',
          features: ['50 Bills/month', 'Basic Invoicing', 'Standard Templates', 'GST Support'],
          status: 'active'
        },
        {
          name: 'Pro',
          price: 10,
          billing_cycle: 'monthly',
          description: 'Advanced features for growing businesses.',
          features: ['Unlimited Bills', 'Advanced Invoicing', 'Premium Templates', 'GST Support', 'Tally Export'],
          status: 'active'
        }
      ]);
      console.log('Seeded initial plans.');
    }

    // 2. Seed Invoice Formats
    const formatsCount = await InvoiceFormat.count();
    if (formatsCount === 0) {
      await InvoiceFormat.bulkCreate([
        // Free Templates (Default Enabled and allowed)
        { name: 'Basic Format', template_identifier: 'standard', required_plan: 'Free', status: 'active' },
        { name: 'Tally Format', template_identifier: 'tally', required_plan: 'Free', status: 'active' },
        
        // Paid Templates (Can be toggled by Admin)
        { name: 'Classic Invoice', template_identifier: 'classic', required_plan: 'Basic', status: 'active' },
        { name: 'Modern Invoice', template_identifier: 'modern', required_plan: 'Basic', status: 'active' },
        { name: 'Wholesale / B2B', template_identifier: 'wholesale', required_plan: 'Basic', status: 'active' },
        
        { name: 'Retail POS Bill', template_identifier: 'retail', required_plan: 'Pro', status: 'active' },
        { name: 'Advanced Tax Invoice', template_identifier: 'advanced', required_plan: 'Pro', status: 'active' },
        { name: 'Service Invoice', template_identifier: 'service', required_plan: 'Pro', status: 'active' },
        { name: 'Proforma Invoice', template_identifier: 'proforma', required_plan: 'Pro', status: 'active' }
      ]);
      console.log('Seeded 9 initial invoice formats.');
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

export {
  sequelize,
  User,
  Company,
  Customer,
  Invoice,
  InvoiceItem,
  Settings,
  AdminSettings,
  Plan,
  Subscription,
  InvoiceFormat
};
