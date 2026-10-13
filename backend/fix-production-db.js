import sequelize from './src/config/db.js';

async function fixProductionDB() {
  console.log('Starting Production DB Constraint Cleanup...');
  try {
    // 1. Check & Drop obsolete pg_constraint on mobile_number alone
    const res = await sequelize.query("SELECT c.conname FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'users' AND c.contype = 'u';");
    const constraints = res[0];
    
    let droppedCount = 0;
    for (const c of constraints) {
      if (c.conname && c.conname.includes('mobile_number') && !c.conname.includes('role')) {
        console.log("Dropping obsolete unique constraint: " + c.conname);
        await sequelize.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS \"" + c.conname + "\";");
        droppedCount++;
      }
    }
    
    // 2. Check & Drop obsolete unique indexes on mobile_number alone
    const [indexes] = await sequelize.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'users' 
        AND indexdef LIKE '%UNIQUE%' 
        AND indexdef LIKE '%mobile_number%'
        AND indexdef NOT LIKE '%role%';
    `);

    for (const idx of indexes) {
      console.log("Dropping obsolete unique index: " + idx.indexname);
      await sequelize.query(`DROP INDEX IF EXISTS "${idx.indexname}";`);
      droppedCount++;
    }

    // 3. Ensure composite index exists
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_number_role_unique 
      ON users (mobile_number, role);
    `);

    console.log('\nCleanup Complete! Successfully cleaned up ' + droppedCount + ' obsolete constraints/indexes.');
    console.log('Your production database is now ready to support multiple roles per mobile number.');
  } catch(e) {
    console.error('An error occurred during database cleanup:', e);
  } finally {
    process.exit(0);
  }
}

fixProductionDB();
