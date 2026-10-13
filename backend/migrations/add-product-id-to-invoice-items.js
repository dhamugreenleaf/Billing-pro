import sequelize from '../src/config/db.js';

/**
 * Migration: Add product_id column to invoice_items table.
 *
 * Links line items to products for inventory tracking, concurrency-safe decrements,
 * and stock reversal on invoice deletion.
 */
export async function runMigration() {
  console.log('[Migration] Starting Add product_id to invoice_items migration...');

  try {
    await sequelize.query(`
      ALTER TABLE invoice_items 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS invoice_items_product_id_idx ON invoice_items(product_id);
    `);

    console.log('[Migration SUCCESS] Column product_id verified/added to invoice_items.');
    return true;
  } catch (error) {
    console.error('[Migration FAILED]:', error.message);
    throw error;
  }
}

// Self-executing if run directly
if (process.argv[1] && (process.argv[1].endsWith('add-product-id-to-invoice-items.js') || process.argv[1].includes('add-product-id-to-invoice-items'))) {
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
