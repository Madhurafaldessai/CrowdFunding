const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const request = require('supertest');
const { app, server } = require('../server');
const { getPool } = require('../src/db/pool');

async function getAuthToken(email, password = 'User123!') {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  return res.body.data.token;
}

afterAll(async () => {
  try {
    const pool = getPool();
    await pool.end();
  } catch (e) {
    // ignore
  }
  await new Promise((resolve) => server.close(resolve));
});

module.exports = {
  app,
  getAuthToken,
  getPool,
};

