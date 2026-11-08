/**
 * backend/src/utils/expireJob.js
 * CLI runner for manually triggering process_expired_campaigns stored procedure.
 */

const path = require('path');
const { getPool, verifyConnection } = require('../db/pool');
const logger = require('./logger');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

async function runExpiredProcessing() {
  logger.info('==========================================================');
  logger.info(' Executing process_expired_campaigns stored procedure...');
  logger.info('==========================================================');

  const check = await verifyConnection();
  if (!check.ok) {
    logger.error(`Database not reachable: ${check.error}`);
    process.exit(1);
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const startTime = Date.now();
    await conn.query('CALL process_expired_campaigns()');
    const elapsed = Date.now() - startTime;
    logger.info(`[+] process_expired_campaigns completed in ${elapsed}ms.`);

    // Query recent changes
    const [recentAudit] = await conn.query(`
      SELECT * FROM audit_log
      WHERE action = 'CAMPAIGN_RESOLVED'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    logger.info(`Resolved Campaigns Log entries: ${recentAudit.length}`);
    recentAudit.forEach(a => {
      logger.info(`  - Campaign #${a.record_id}: ${a.old_status} -> ${a.new_status}`);
    });

    logger.info('==========================================================');
    logger.info('[+] Expire check completed successfully.');
    logger.info('==========================================================');
  } catch (err) {
    logger.error(`[-] Expire processing failed: ${err.message}`);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

runExpiredProcessing();

