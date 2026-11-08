const request = require('supertest');
const { app, getAuthToken } = require('./setup');

describe('Auth & Authorization API Tests', () => {
  const testEmail = `testuser_${Date.now()}@crowdfund.io`;

  test('1. Registration and login', async () => {
    // Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Automated Test User',
        email: testEmail,
        password: 'Password123!',
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.success).toBe(true);
    expect(regRes.body.data.user.email).toBe(testEmail);
    expect(regRes.body.data.token).toBeDefined();

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123!',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.token).toBeDefined();

    // Me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testEmail);
    expect(meRes.body.data.user.password_hash).toBeUndefined();
  });

  test('2. Unauthorized API access is properly rejected', async () => {
    // Accessing protected endpoint without token
    const resNoToken = await request(app).get('/api/pledges/mine');
    expect(resNoToken.status).toBe(401);
    expect(resNoToken.body.success).toBe(false);

    // Accessing with invalid token
    const resBadToken = await request(app)
      .get('/api/pledges/mine')
      .set('Authorization', 'Bearer invalid_signature_token');
    expect(resBadToken.status).toBe(401);

    // Normal user attempting admin-only endpoint
    const userToken = await getAuthToken('backer@crowdfund.io', 'User123!');
    const resAdminForbidden = await request(app)
      .get('/api/admin/campaigns/pending')
      .set('Authorization', `Bearer ${userToken}`);
    expect(resAdminForbidden.status).toBe(403);
  });
});

