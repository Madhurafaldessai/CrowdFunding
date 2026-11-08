const mysql = require('mysql2/promise');
const config = require('../config/env');
const logger = require('../utils/logger');
const fs = require('fs');

let pool = null;
let isConnected = false;
let retryCount = 0;
let retryTimer = null;

function createDbPool() {
  const poolConfig = {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.name,
    waitForConnections: true,
    connectionLimit: 15,
    queueLimit: 0,
    connectTimeout: 5000,
    timezone: 'Z', // UTC
    dateStrings: true,
  };

  logger.info(`Configuring MySQL Connection Pool: [Host: ${config.db.host}, Port: ${config.db.port}, Database: ${config.db.name}, User: ${config.db.user}]`);

  pool = mysql.createPool(poolConfig);

  // Pool error listener
  pool.on('error', (err) => {
    logger.error(`MySQL Pool Error: ${err.code || err.message}`);
    isConnected = false;
    scheduleReconnect();
  });

  return pool;
}

async function verifyConnection() {
  if (!pool) {
    createDbPool();
  }

  // Also check external drive mount
  const driveMount = config.db.dataDir.split('/MySQL')[0];
  let driveMounted = true;
  try {
    if (driveMount.startsWith('/Volumes') && !fs.existsSync(driveMount)) {
      driveMounted = false;
      logger.warn(`External drive mount missing at: ${driveMount}`);
    }
  } catch (err) {
    // Continue
  }

  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    if (!isConnected) {
      logger.info(`[+] Connected to MySQL (${config.db.host}:${config.db.port}/${config.db.name})`);
    }
    isConnected = true;
    retryCount = 0;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    return { ok: true, driveMounted };
  } catch (err) {
    isConnected = false;
    logger.warn(`Database connection check failed: ${err.message}. Retrying...`);
    scheduleReconnect();
    return { ok: false, error: err.message, driveMounted };
  }
}

function scheduleReconnect() {
  if (retryTimer) return;
  const delay = Math.min(1000 * Math.pow(2, retryCount), 15000);
  retryCount++;
  logger.info(`Scheduling database reconnection in ${delay}ms (attempt ${retryCount})...`);
  retryTimer = setTimeout(async () => {
    retryTimer = null;
    await verifyConnection();
  }, delay);
}

function getPool() {
  if (!pool) {
    createDbPool();
  }
  return pool;
}

function isDbReady() {
  return isConnected;
}

module.exports = {
  createDbPool,
  verifyConnection,
  getPool,
  isDbReady,
};

