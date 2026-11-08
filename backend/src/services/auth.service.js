const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { getPool } = require('../db/pool');

class AuthService {
  async register({ name, email, password }) {
    const pool = getPool();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      const err = new Error('Email is already registered.');
      err.status = 409;
      throw err;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), normalizedEmail, passwordHash, 'user', 'active']
    );

    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email: normalizedEmail, role: 'user' }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    return {
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: 'user',
        status: 'active',
      },
      token,
    };
  }

  async login({ email, password }) {
    const pool = getPool();
    const normalizedEmail = email.toLowerCase().trim();

    const [users] = await pool.query(
      'SELECT id, name, email, password_hash, role, status, avatar_url, bio FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (users.length === 0) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const user = users[0];

    if (user.status !== 'active') {
      const err = new Error('Your account has been suspended. Please contact platform administration.');
      err.status = 403;
      throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      const err = new Error('Invalid email or password.');
      err.status = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    const { password_hash, ...safeUser } = user;
    return {
      user: safeUser,
      token,
    };
  }

  async getMe(userId) {
    const pool = getPool();
    const [users] = await pool.query(
      'SELECT id, name, email, role, status, avatar_url, bio, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      const err = new Error('User not found.');
      err.status = 404;
      throw err;
    }

    return users[0];
  }
}

module.exports = new AuthService();

