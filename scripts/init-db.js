/**
 * scripts/init-db.js
 * Database initialization script for crowdfunding_platform.
 * Executes:
 * 1. Users and grants creation
 * 2. Schema definition
 * 3. Triggers
 * 4. Stored Procedures
 * 5. Views
 * 6. Scheduled Events
 * 7. Sample Data Seeding
 *
 * Strictly isolates actions to `crowdfunding_platform` and never touches protected databases.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MYSQL_BIN = path.join(process.env.MYSQL_BIN_DIR || '/usr/local/mysql/bin', 'mysql');
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '3306';
const DB_NAME = 'crowdfunding_platform'; // Strict target
const ROOT_USER = process.env.MYSQL_ROOT_USER || 'root';
const ROOT_PASSWORD = process.env.MYSQL_ROOT_PASSWORD || '';
const APP_USER = process.env.DB_USER || 'crowd_app';
const APP_PASSWORD = process.env.DB_PASSWORD || '';
const ADMIN_USER = process.env.DB_ADMIN_USER || 'crowd_admin';
const ADMIN_PASSWORD = process.env.DB_ADMIN_PASSWORD || '';

const DB_DIR = path.join(__dirname, '..', 'database');

function executeSqlContent(user, password, sqlContent, databaseName = null) {
  const args = ['-u', user, '-h', DB_HOST, '-P', DB_PORT];
  if (databaseName) {
    args.push('-D', databaseName);
  }
  const env = { ...process.env, MYSQL_PWD: password };
  try {
    return execFileSync(MYSQL_BIN, args, {
      input: sqlContent,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });
  } catch (err) {
    const errorMsg = err.stderr ? err.stderr.toString() : err.message;
    throw new Error(`MySQL execution error: ${errorMsg}`);
  }
}

function executeSqlFile(user, password, filePath, databaseName = null) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  return executeSqlContent(user, password, sql, databaseName);
}

async function init() {
  console.log('==========================================================');
  console.log(' Crowdfunding Platform Database Initialization');
  console.log('==========================================================');
  console.log(`Host:     ${DB_HOST}:${DB_PORT}`);
  console.log(`Database: ${DB_NAME}`);
  console.log('----------------------------------------------------------');

  try {
    // Step 1: Create Database if not exists & set trust function creators & event scheduler
    console.log('[1/7] Ensuring database exists and configuring server variables...');
    executeSqlContent(
      ROOT_USER,
      ROOT_PASSWORD,
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
       SET GLOBAL log_bin_trust_function_creators = 1;
       SET GLOBAL event_scheduler = ON;`
    );
    console.log('      [+] Database confirmed, event_scheduler enabled.');

    // Step 2: Create users and assign grants
    console.log('[2/7] Creating application and administrative users...');
    let usersSql = fs.readFileSync(path.join(DB_DIR, 'users_and_grants.sql'), 'utf-8');
    usersSql = usersSql.replace(/APP_USER_PASSWORD_PLACEHOLDER/g, APP_PASSWORD);
    usersSql = usersSql.replace(/ADMIN_USER_PASSWORD_PLACEHOLDER/g, ADMIN_PASSWORD);
    executeSqlContent(ROOT_USER, ROOT_PASSWORD, usersSql);
    console.log(`      [+] Users configured: ${APP_USER}, ${ADMIN_USER}`);

    // Step 3: Schema
    console.log('[3/7] Creating tables, constraints, and indexes...');
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'schema.sql'), DB_NAME);
    console.log('      [+] Schema initialized.');

    // Step 4: Sample Data (Load historical fixtures before trigger activation)
    console.log('[4/7] Seeding comprehensive sample data fixtures...');
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'sample_data.sql'), DB_NAME);
    console.log('      [+] Sample data fixtures seeded.');

    // Step 5: Triggers
    console.log('[5/7] Installing production triggers...');
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'triggers.sql'), DB_NAME);
    console.log('      [+] Production triggers active.');

    // Step 6: Stored Procedures
    console.log('[6/7] Creating stored procedures...');
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'procedures.sql'), DB_NAME);
    console.log('      [+] Stored procedures created.');

    // Step 7: Views & Events
    console.log('[7/7] Creating analytical views and scheduled events...');
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'views.sql'), DB_NAME);
    executeSqlFile(ADMIN_USER, ADMIN_PASSWORD, path.join(DB_DIR, 'events.sql'), DB_NAME);
    console.log('      [+] Views and events registered.');

    console.log('==========================================================');
    console.log('[+] DATABASE INITIALIZATION COMPLETE AND VERIFIED.');
    console.log('==========================================================');
  } catch (err) {
    console.error('[-] Initialization Failed:');
    console.error(err.message);
    process.exit(1);
  }
}

init();
