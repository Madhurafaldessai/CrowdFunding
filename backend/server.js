const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');
const { verifyConnection, getPool } = require('./src/db/pool');
const dbCheck = require('./src/middleware/dbCheck');
const errorHandler = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

// Import route modules
const authRoutes = require('./src/routes/auth.routes');
const campaignsRoutes = require('./src/routes/campaigns.routes');
const tiersRoutes = require('./src/routes/tiers.routes');
const pledgesRoutes = require('./src/routes/pledges.routes');
const creatorRoutes = require('./src/routes/creator.routes');
const adminRoutes = require('./src/routes/admin.routes');
const categoriesRoutes = require('./src/routes/categories.routes');
const healthRoutes = require('./src/routes/health.routes');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general API rate limiter
app.use('/api', apiLimiter);

// Database availability middleware (returns 503 if disconnected)
app.use(dbCheck);

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/campaigns/:id/tiers', tiersRoutes);
app.use('/api/pledges', pledgesRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Central error handler
app.use(errorHandler);

// Start server
const server = app.listen(config.port, async () => {
  logger.info(`==========================================================`);
  logger.info(` Crowdfunding API Server running on port ${config.port}`);
  logger.info(` Environment: ${config.nodeEnv}`);
  logger.info(` Target DB:   ${config.db.host}:${config.db.port}/${config.db.name}`);
  logger.info(`==========================================================`);

  // Verify DB connection without blocking server startup
  await verifyConnection();
});

// Graceful shutdown handling
function handleGracefulShutdown(signal) {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      const pool = getPool();
      await pool.end();
      logger.info('Database connection pool drained and closed.');
    } catch (err) {
      logger.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });

  // Force exit if not closed within 10s
  setTimeout(() => {
    logger.error('Forcefully terminating process due to shutdown timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

module.exports = { app, server };

