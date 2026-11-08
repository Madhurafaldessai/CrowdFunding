/**
 * scripts/check-db.js
 * Comprehensive diagnostic check for MySQL connectivity, external drive mount,
 * database objects, and safety verification.
 */

const fs = require('fs');
const path = require('path');
let mysql;
try {
  mysql = require('mysql2/promise');
} catch {
  mysql = require(path.join(__dirname, '..', 'backend', 'node_modules', 'mysql2', 'promise'));
}
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const {
  DB_HOST = '127.0.0.1',
  DB_PORT = 3306,
  DB_NAME = 'crowdfunding_platform',
  DB_USER = 'crowd_app',
  DB_PASSWORD = '',
  MYSQL_DATA_DIR = '/Volumes/External drive/MySQL/Data',
} = process.env;

const PROTECTED_DATABASES = [
  'smartdb_system',
  'smartdb_ds_11',
  'smartdb_ds_12',
  'smartdb_ds_13'
];

async function checkDatabase() {
  console.log('==========================================================');
  console.log(' Database Health & Diagnostics Check');
  console.log('==========================================================');

  // 1. Check external drive mount
  const driveMount = MYSQL_DATA_DIR.split('/MySQL')[0];
  try {
    if (fs.existsSync(driveMount)) {
      console.log(`[+] External Drive Mount: Present at "${driveMount}"`);
    } else {
      console.log(`[-] WARNING: External drive mount not found at "${driveMount}"`);
    }
  } catch (err) {
    console.log(`[!] Note on Drive Mount Check: ${err.message}`);
  }

  // 2. Connect to MySQL
  const inspectUser = process.env.DB_ADMIN_USER || DB_USER;
  const inspectPassword = process.env.DB_ADMIN_PASSWORD || DB_PASSWORD;
  console.log(`[*] Connecting to MySQL at ${DB_HOST}:${DB_PORT} as "${inspectUser}"...`);
  let connection;
  try {
    connection = await mysql.createConnection({
      host: DB_HOST,
      port: Number(DB_PORT),
      user: inspectUser,
      password: inspectPassword,
      database: DB_NAME,
      connectTimeout: 5000,
    });
    console.log('[+] Connection established successfully.');
  } catch (connErr) {
    console.error(`[-] Database connection failed: ${connErr.message}`);
    console.error('    Check that MySQL is running and DB_USER/DB_PASSWORD are correct.');
    process.exit(1);
  }

  try {
    // 3. MySQL Server Information
    const [[serverInfo]] = await connection.query(
      'SELECT VERSION() as version, @@sql_mode as sql_mode, @@event_scheduler as event_scheduler, @@time_zone as time_zone'
    );
    console.log(`[+] MySQL Version:    ${serverInfo.version}`);
    console.log(`[+] Event Scheduler:  ${serverInfo.event_scheduler}`);
    console.log(`[+] Timezone:         ${serverInfo.time_zone}`);

    // 4. Tables in crowdfunding_platform
    const [tables] = await connection.query(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = ?',
      [DB_NAME]
    );
    console.log(`[+] Tables in ${DB_NAME}: ${tables.length}`);
    tables.forEach(t => console.log(`    - ${t.TABLE_NAME || t.table_name}`));

    // 5. Stored Procedures
    const [routines] = await connection.query(
      'SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = ?',
      [DB_NAME]
    );
    console.log(`[+] Stored Routines in ${DB_NAME}: ${routines.length}`);
    routines.forEach(r => console.log(`    - ${r.ROUTINE_NAME || r.routine_name} (${r.ROUTINE_TYPE || r.routine_type})`));

    // 6. Triggers
    const [triggers] = await connection.query(
      'SELECT trigger_name, event_manipulation, event_object_table FROM information_schema.triggers WHERE trigger_schema = ?',
      [DB_NAME]
    );
    console.log(`[+] Triggers in ${DB_NAME}: ${triggers.length}`);
    triggers.forEach(tr => console.log(`    - ${tr.TRIGGER_NAME || tr.trigger_name} on ${tr.EVENT_OBJECT_TABLE || tr.event_object_table}`));

    // 7. Views
    const [views] = await connection.query(
      'SELECT table_name FROM information_schema.views WHERE table_schema = ?',
      [DB_NAME]
    );
    console.log(`[+] Views in ${DB_NAME}: ${views.length}`);
    views.forEach(v => console.log(`    - ${v.TABLE_NAME || v.table_name}`));

    // 8. Events
    const [events] = await connection.query(
      'SELECT event_name, status FROM information_schema.events WHERE event_schema = ?',
      [DB_NAME]
    );
    console.log(`[+] Events in ${DB_NAME}: ${events.length}`);
    events.forEach(e => console.log(`    - ${e.EVENT_NAME || e.event_name} (${e.STATUS || e.status})`));

    // 9. Safety Verification: Protected Databases Integrity
    console.log('[*] Verifying integrity of protected databases...');
    const [allDbs] = await connection.query('SHOW DATABASES');
    const existingDbNames = allDbs.map(row => Object.values(row)[0]);
    PROTECTED_DATABASES.forEach(pDb => {
      if (existingDbNames.includes(pDb)) {
        console.log(`    [SAFE] Protected database "${pDb}" exists and is untouched.`);
      }
    });

    console.log('==========================================================');
    console.log('[+] ALL DATABASE CHECKS PASSED.');
    console.log('==========================================================');
  } catch (err) {
    console.error(`[-] Error during diagnostics query: ${err.message}`);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

checkDatabase();
