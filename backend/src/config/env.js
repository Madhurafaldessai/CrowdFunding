const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_crowdfunding_32_chars_min_safe',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    socket: process.env.DB_SOCKET || '/tmp/mysql.sock',
    name: process.env.DB_NAME || 'crowdfunding_platform',
    user: process.env.DB_USER || 'crowd_app',
    password: process.env.DB_PASSWORD || '',
    adminUser: process.env.DB_ADMIN_USER || 'crowd_admin',
    adminPassword: process.env.DB_ADMIN_PASSWORD || '',
    dataDir: process.env.MYSQL_DATA_DIR || '/Volumes/External drive/MySQL/Data',
  },
};
