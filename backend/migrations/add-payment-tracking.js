import sequelize from '../src/config/db.js';

/**
 * Migration: Add payment tracking fields to invoices and create invoice_payments table.
 * 
 * 1. Adds paid_amount (DECIMAL(10, 2), default 0.00) to invoices table if not exists.
 * 2. Adds payment_status (VARCHAR(50), default 'unpaid') to invoices table if not exists.
 * 3. Creates invoice_payments table with foreign keys to companies and invoices.
 * 4. Adds index on invoices(company_id, payment_status) for fast pending/outstanding lookups.
 * 5. Adds unique index on invoice_payments(invoice_id, payment_reference) where payment_reference IS NOT NULL.
 * 6. Preserves historical data: backfills NULL paid_amount to 0.00 and NULL payment_status based on status.
 */
export async function runMigration() {
  console.log('[Migration] Starting Payment Tracking Migration...');

  try {
    // 1. Add paid_amount to invoices if not exists
    await sequelize.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;
    `);
    console.log('[Migration] Column paid_amount verified/added to invoices.');

    // 2. Add payment_status to invoices if not exists
    await sequelize.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid';
    `);
    console.log('[Migration] Column payment_status verified/added to invoices.');

    // 3. Backfill any historical records where status might already indicate paid
    await sequelize.query(`
      UPDATE invoices
      SET payment_status = 'paid', paid_amount = total_amount
      WHERE status = 'paid' AND (payment_status IS NULL OR payment_status = 'unpaid');
    `);

    // 4. Create invoice_payments table if not exists
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS invoice_payments (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id),
        invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_reference VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('[Migration] Table invoice_payments verified/created.');

    // 5. Create index on invoice_payments(invoice_id, payment_reference)
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payments_invoice_reference_unique
      ON invoice_payments (invoice_id, payment_reference)
      WHERE payment_reference IS NOT NULL;
    `);

    // 6. Create index on invoices(company_id, payment_status)
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_company_payment_status
      ON invoices (company_id, payment_status);
    `);

    console.log('[Migration SUCCESS] Payment tracking migration completed.');
    return true;
  } catch (error) {
    console.error('[Migration FAILED]:', error.message);
    throw error;
  }
}

// Self-executing if run directly
if (process.argv[1] && (process.argv[1].endsWith('add-payment-tracking.js') || process.argv[1].includes('add-payment-tracking'))) {
  runMigration()
    .then(() => {
      console.log('Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
