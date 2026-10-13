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
import Product from '../modules/product/model/product.model.js';
import Payment from '../modules/invoice/model/payment.model.js';

const cleanObsoleteUserConstraints = async () => {
  try {
    // 1. Drop obsolete unique constraints on users.mobile_number (where constraint doesn't include 'role')
    const [constraints] = await sequelize.query(`
      SELECT c.conname 
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'users' 
        AND c.contype = 'u';
    `);

    for (const c of constraints) {
      if (c.conname && c.conname.includes('mobile_number') && !c.conname.includes('role')) {
        console.log(`[DB Migration] Dropping obsolete unique constraint: ${c.conname}`);
        await sequelize.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS "${c.conname}";`);
      }
    }

    // 2. Drop obsolete unique indexes on users.mobile_number alone
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' 
        AND indexdef LIKE '%UNIQUE%' 
        AND indexdef LIKE '%mobile_number%'
        AND indexdef NOT LIKE '%role%';
    `);

    for (const idx of indexes) {
      console.log(`[DB Migration] Dropping obsolete unique index: ${idx.indexname}`);
      await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
    }

    // 3. Ensure composite unique index on (mobile_number, role) exists
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_number_role_unique 
      ON users (mobile_number, role);
    `);
    console.log('[DB Migration] Verified users unique composite index (mobile_number, role).');

    // 4. Ensure composite unique index on (company_id, invoice_number) exists for invoices
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_company_invoice_number_unique
      ON invoices (company_id, invoice_number);
    `);
    console.log('[DB Migration] Verified invoices unique composite index (company_id, invoice_number).');

    // 5. Ensure payment tracking columns exist on invoices
    await sequelize.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    `);
    await sequelize.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid';
    `);
    console.log('[DB Migration] Verified invoices payment tracking columns.');

    // 6. Ensure product_id column exists on invoice_items
    await sequelize.query(`
      ALTER TABLE invoice_items 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    `);
    console.log('[DB Migration] Verified invoice_items product_id column.');

    // 7. Ensure companies table has logo as TEXT and other profile columns
    await sequelize.query(`
      ALTER TABLE companies ALTER COLUMN logo TYPE TEXT;
    `).catch(() => {});
    await sequelize.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS business_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS address_line_2 VARCHAR(255),
      ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
      ADD COLUMN IF NOT EXISTS pan VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "registrationType" VARCHAR(50) DEFAULT 'Regular',
      ADD COLUMN IF NOT EXISTS website VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "additionalPhone" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS description TEXT;
    `).catch(() => {});
    console.log('[DB Migration] Verified companies logo and profile columns.');
  } catch (err) {
    console.warn('[DB Migration] Note on obsolete constraints cleanup:', err.message);
  }
};

export const syncDatabase = async () => {
  try {
    // Clean obsolete constraints first so alter sync doesn't conflict
    await cleanObsoleteUserConstraints();

    // In production, sync tables
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
    
    // Ensure clean state after sync
    await cleanObsoleteUserConstraints();

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
          description: 'For new and very small businesses',
          features: ['10 bills per month', 'Basic billing format', 'Basic product management', 'Basic customer management', 'No GST invoicing'],
          status: 'active'
        },
        {
          name: 'Basic',
          price: 299,
          billing_cycle: 'monthly',
          description: 'For small shops and startups',
          features: ['Up to 1,500 bills per month', '⚡ Express Bill unlocked', 'GST support', 'Basic Format', 'Classic Invoice', 'Wholesale B2B Invoice', 'Product management', 'Customer management', 'Sales history & reports'],
          status: 'active'
        },
        {
          name: 'Pro',
          price: 499,
          billing_cycle: 'monthly',
          description: 'For growing retail and textile businesses',
          features: ['Up to 2,500 bills per month', '📦 Products & Services module unlocked', 'Everything in Basic', 'Modern Invoice', 'Retail POS Bill', 'Advanced Tax Invoice', 'Service Invoice', 'Proforma Invoice', 'Tally-format invoice and export', 'Advanced product management'],
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
  InvoiceFormat,
  Product,
  Payment
};
