const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPool } = require('../db/pool');
const { errorResponse } = require('../utils/response');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication token required.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (jwtErr) {
      return errorResponse(res, 'Invalid or expired token.', 401);
    }

    const pool = getPool();
    const [users] = await pool.query(
      'SELECT id, name, email, role, status FROM users WHERE id = ?',
      [decoded.id]
    );

    if (users.length === 0) {
      return errorResponse(res, 'User account not found.', 401);
    }

    const user = users[0];
    if (user.status !== 'active') {
      return errorResponse(res, 'User account is suspended.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }
    if (req.user.role !== role) {
      return errorResponse(res, `Forbidden: requires ${role} role.`, 403);
    }
    next();
  };
}

async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        const pool = getPool();
        const [users] = await pool.query(
          'SELECT id, name, email, role, status FROM users WHERE id = ?',
          [decoded.id]
        );
        if (users.length > 0 && users[0].status === 'active') {
          req.user = users[0];
        }
      } catch {
        // Ignore invalid token in optionalAuth
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
};

