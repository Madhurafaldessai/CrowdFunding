const logger = require('../utils/logger');
const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error [${req.method} ${req.url}]:`, err.message || err);

  // Database unavailability / Connection errors
  if (
    err.code === 'ECONNREFUSED' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    (err.message && err.message.includes('Can\'t connect to MySQL server'))
  ) {
    return errorResponse(
      res,
      'Database service is currently unavailable. Please check that MySQL and external storage are connected.',
      503
    );
  }

  // Trigger custom business rule rejection (SQLSTATE 45000)
  if (err.sqlState === '45000' || (err.message && err.message.includes('SIGNAL SQLSTATE'))) {
    const cleanMsg = err.sqlMessage || err.message;
    return errorResponse(res, cleanMsg, 400);
  }

  // Duplicate entry constraint violation
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'A duplicate entry already exists for this resource.', 409);
  }

  // Check constraint violation
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return errorResponse(res, 'Database validation constraint failed on submitted values.', 400);
  }

  // Foreign key constraint violation
  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(res, 'Referenced relationship constraint violation.', 400);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal Server Error'
    : err.message || 'An unexpected error occurred.';

  return errorResponse(res, message, statusCode);
}

module.exports = errorHandler;

