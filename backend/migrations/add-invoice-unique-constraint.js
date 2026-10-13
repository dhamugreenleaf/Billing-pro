import sequelize from '../src/config/db.js';

/**
 * Migration: Add composite unique index on (company_id, invoice_number) to invoices table.
 *
 * Pre-checks:
 * 1. Checks if any duplicates currently exist in invoices.
 * 2. Checks if the unique index already exists.
 * 3. Creates UNIQUE INDEX IF NOT EXISTS invoices_company_invoice_number_unique.
 */
export async function runMigration() {
  console.log('[Migration] Starting Invoice Number Unique Constraint Migration...');

  try {
    // 1. Verify no duplicate (company_id, invoice_number) exists
    const [duplicates] = await sequelize.query(`
      SELECT company_id, invoice_number, COUNT(*) as count
      FROM invoices
      GROUP BY company_id, invoice_number
      HAVING COUNT(*) > 1;
    `);

    if (duplicates && duplicates.length > 0) {
      console.error('[Migration ERROR] Found duplicate invoice numbers:', duplicates);
      throw new Error(`Cannot apply unique constraint: ${duplicates.length} duplicate (company_id, invoice_number) groups found.`);
    }

    console.log('[Migration] Pre-check passed: 0 duplicate invoice numbers found.');

    // 2. Add composite unique index if not exists
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS invoices_company_invoice_number_unique
      ON invoices (company_id, invoice_number);
    `);

    console.log('[Migration SUCCESS] Unique index invoices_company_invoice_number_unique verified/created.');
    return true;
  } catch (error) {
    console.error('[Migration FAILED]:', error.message);
    throw error;
  }
}

// Self-executing if run directly
if (process.argv[1] && (process.argv[1].endsWith('add-invoice-unique-constraint.js') || process.argv[1].includes('add-invoice-unique-constraint'))) {
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
