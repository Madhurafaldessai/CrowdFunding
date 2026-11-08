const { isDbReady, verifyConnection } = require('../db/pool');
const { errorResponse } = require('../utils/response');

async function dbCheck(req, res, next) {
  // Exclude health endpoint from blocking
  if (req.path === '/api/health') {
    return next();
  }

  if (!isDbReady()) {
    // Attempt immediate lightweight check
    const status = await verifyConnection();
    if (!status.ok) {
      return errorResponse(
        res,
        'Database or external storage drive is temporarily unavailable. Please verify external storage connection.',
        503
      );
    }
  }

  next();
}

module.exports = dbCheck;

