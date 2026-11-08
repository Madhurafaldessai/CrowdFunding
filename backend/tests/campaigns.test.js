const request = require('supertest');
const { app, getAuthToken } = require('./setup');

describe('Campaigns Lifecycle & Role Restrictions', () => {
  let creatorToken;
  let anotherUserToken;
  let adminToken;
  let createdCampaignId;

  beforeAll(async () => {
    creatorToken = await getAuthToken('creator@crowdfund.io', 'User123!');
    anotherUserToken = await getAuthToken('backer@crowdfund.io', 'User123!');
    adminToken = await getAuthToken('admin@crowdfund.io', 'Admin123!');
  });

  test('3 & 5. Creator creates a draft campaign and configures reward tiers', async () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);

    const res = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Quantum Sensor Array Development',
        categoryId: 1,
        description: 'Next-generation quantum magnetometer for geomagnetic navigation.',
        story: 'Our team is developing room-temperature quantum diamond NV centers for non-GPS navigation.',
        goalAmount: 25000,
        deadline: deadline.toISOString(),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.campaign.status).toBe('draft');
    createdCampaignId = res.body.data.campaign.id;

    // Creator adds reward tier
    const tierRes = await request(app)
      .post(`/api/campaigns/${createdCampaignId}/tiers`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Sensor Dev Kit',
        description: 'Complete assembled breakout board and documentation.',
        minAmount: 150,
        quantity: 20,
        estimatedDelivery: 'Jan 2027',
      });

    expect(tierRes.status).toBe(201);
    expect(tierRes.body.data.tier.title).toBe('Sensor Dev Kit');

    // Another user cannot edit or modify this campaign (Creator-only action)
    const unauthorizedEditRes = await request(app)
      .put(`/api/campaigns/${createdCampaignId}`)
      .set('Authorization', `Bearer ${anotherUserToken}`)
      .send({ title: 'Hacked Title' });

    expect(unauthorizedEditRes.status).toBe(403);
  });

  test('5. Campaign submission for review and Admin approval', async () => {
    // Creator submits draft
    const submitRes = await request(app)
      .post(`/api/campaigns/${createdCampaignId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.data.campaign.status).toBe('pending_approval');

    // Admin views pending list (Admin-only action)
    const pendingListRes = await request(app)
      .get('/api/admin/campaigns/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(pendingListRes.status).toBe(200);
    const found = pendingListRes.body.data.campaigns.some((c) => c.id === createdCampaignId);
    expect(found).toBe(true);

    // Admin approves campaign (Calls stored procedure approve_campaign)
    const approveRes = await request(app)
      .post(`/api/admin/campaigns/${createdCampaignId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.campaign.status).toBe('active');
  });

  test('4. Admin Rejection with Reason Workflow', async () => {
    // Create another test draft campaign to test rejection
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 20);

    const campRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Draft Campaign to be Rejected',
        categoryId: 2,
        description: 'Test game description for rejection flow.',
        story: 'Test game story content...',
        goalAmount: 5000,
        deadline: deadline.toISOString(),
      });
    const rejCampId = campRes.body.data.campaign.id;

    // Add tier
    await request(app)
      .post(`/api/campaigns/${rejCampId}/tiers`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Beta Key',
        description: 'Early access key.',
        minAmount: 20,
      });

    // Submit for approval
    await request(app)
      .post(`/api/campaigns/${rejCampId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    // Admin rejects with reason (Calls stored procedure reject_campaign)
    const rejectRes = await request(app)
      .post(`/api/admin/campaigns/${rejCampId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Please provide working prototype video link in story.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.campaign.status).toBe('draft');
    expect(rejectRes.body.data.campaign.rejection_reason).toContain('prototype video');
  });
});

