const { getPool, verifyConnection, isDbReady } = require('./pool');
const config = require('../config/env');
const fs = require('fs');

async function getHealthStatus() {
  const driveMount = config.db.dataDir.split('/MySQL')[0];
  let driveMounted = false;
  try {
    driveMounted = fs.existsSync(driveMount);
  } catch {
    driveMounted = false;
  }

  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: false,
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      user: config.db.user,
      latencyMs: null,
    },
    storage: {
      driveMount,
      mounted: driveMounted,
      dataDir: config.db.dataDir,
    },
  };

  const startTime = Date.now();
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT 1 as ping, VERSION() as version');
    status.database.connected = true;
    status.database.latencyMs = Date.now() - startTime;
    status.database.version = rows[0].version;
  } catch (err) {
    status.status = 'degraded';
    status.database.connected = false;
    status.database.error = err.message;
  }

  if (!status.database.connected || !driveMounted) {
    status.status = 'error';
  }

  return status;
}

module.exports = {
  getHealthStatus,
};

