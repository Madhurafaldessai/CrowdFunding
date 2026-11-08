const request = require('supertest');
const { app, getAuthToken, getPool } = require('./setup');

describe('Pledge Transactions, Constraints & Concurrency Control', () => {
  let creatorToken;
  let backer1Token;
  let backer2Token;
  let campaignId;
  let limitedTierId;

  beforeAll(async () => {
    creatorToken = await getAuthToken('creator@crowdfund.io', 'User123!');
    backer1Token = await getAuthToken('backer@crowdfund.io', 'User123!');
    backer2Token = await getAuthToken('grace@crowdfund.io', 'User123!');

    // Create an active test campaign with a limited tier (quantity = 1 for concurrent testing)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 15);

    const campRes = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Limited Hardware Batch Experiment',
        categoryId: 1,
        description: 'Concurrency and atomic transaction test campaign.',
        story: 'Testing pessimistic row-level locking and payment rollbacks under concurrency.',
        goalAmount: 10000,
        deadline: deadline.toISOString(),
      });
    campaignId = campRes.body.data.campaign.id;

    // Add limited reward tier with quantity = 1 (exactly 1 slot!)
    const tierRes = await request(app)
      .post(`/api/campaigns/${campaignId}/tiers`)
      .set('Authorization', `Bearer ${creatorToken}`)
      .send({
        title: 'Exclusive Gold Prototype',
        description: 'Limited edition of exactly 1 prototype unit.',
        minAmount: 500,
        quantity: 1, // EXACTLY 1 SLOT
        estimatedDelivery: 'Dec 2026',
      });
    limitedTierId = tierRes.body.data.tier.id;

    // Submit and approve campaign
    await request(app)
      .post(`/api/campaigns/${campaignId}/submit`)
      .set('Authorization', `Bearer ${creatorToken}`);

    const adminToken = await getAuthToken('admin@crowdfund.io', 'Admin123!');
    await request(app)
      .post(`/api/admin/campaigns/${campaignId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  test('7. Self-pledging is strictly rejected by procedure and trigger', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/pledges`)
      .set('Authorization', `Bearer ${creatorToken}`) // Creator pledging to their own campaign
      .send({
        amount: 100,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Creators cannot pledge to their own campaigns');
  });

  test('8. Insufficient reward-tier amount rejected', async () => {
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/pledges`)
      .set('Authorization', `Bearer ${backer1Token}`)
      .send({
        tierId: limitedTierId,
        amount: 250, // Minimum is 500
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('at least $500');
  });

  test('6. Expired campaign pledging rejected', async () => {
    // Campaign 11 is an expired/failed campaign in sample data
    const res = await request(app)
      .post('/api/campaigns/11/pledges')
      .set('Authorization', `Bearer ${backer1Token}`)
      .send({
        amount: 50,
      });

    expect(res.status).toBe(400);
  });

  test('11. Payment failure triggers complete rollback (no pledge created, stock untouched)', async () => {
    const pool = getPool();
    // Check initial claimed quantity
    const [[initialTier]] = await pool.query('SELECT claimed_quantity FROM reward_tiers WHERE id = ?', [limitedTierId]);
    expect(initialTier.claimed_quantity).toBe(0);

    // Force payment failure
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/pledges`)
      .set('Authorization', `Bearer ${backer1Token}`)
      .send({
        tierId: limitedTierId,
        amount: 500,
        forcedPaymentOutcome: 'FAILURE', // SIMULATE GATEWAY DECLINE
      });

    expect(res.status).toBe(402);
    expect(res.body.message).toContain('declined');

    // Verify rollback: Tier claimed quantity must still be 0!
    const [[afterTier]] = await pool.query('SELECT claimed_quantity FROM reward_tiers WHERE id = ?', [limitedTierId]);
    expect(afterTier.claimed_quantity).toBe(0);

    // Verify no pledge was saved
    const [pledges] = await pool.query('SELECT * FROM pledges WHERE campaign_id = ? AND tier_id = ?', [campaignId, limitedTierId]);
    expect(pledges.length).toBe(0);
  });

  test('10. Concurrent pledges competing for the final reward slot: EXACTLY ONE SUCCEEDS', async () => {
    const pool = getPool();

    // Verify tier has 1 slot available
    const [[beforeTier]] = await pool.query('SELECT claimed_quantity, quantity FROM reward_tiers WHERE id = ?', [limitedTierId]);
    expect(beforeTier.claimed_quantity).toBe(0);
    expect(beforeTier.quantity).toBe(1);

    // Fire two simultaneous competing pledge requests for the single available slot
    const [res1, res2] = await Promise.all([
      request(app)
        .post(`/api/campaigns/${campaignId}/pledges`)
        .set('Authorization', `Bearer ${backer1Token}`)
        .send({
          tierId: limitedTierId,
          amount: 500,
          forcedPaymentOutcome: 'SUCCESS',
        }),
      request(app)
        .post(`/api/campaigns/${campaignId}/pledges`)
        .set('Authorization', `Bearer ${backer2Token}`)
        .send({
          tierId: limitedTierId,
          amount: 500,
          forcedPaymentOutcome: 'SUCCESS',
        }),
    ]);

    const statuses = [res1.status, res2.status];
    // Exactly one must succeed (201) and exactly one must fail with stock exhaustion (400)
    expect(statuses).toContain(201);
    expect(statuses).toContain(400);

    // Verify claimed quantity is capped exactly at 1 (never oversold!)
    const [[afterTier]] = await pool.query('SELECT claimed_quantity, quantity FROM reward_tiers WHERE id = ?', [limitedTierId]);
    expect(afterTier.claimed_quantity).toBe(1);

    // Verify exactly one confirmed pledge exists in database for this tier
    const [confirmedPledges] = await pool.query(
      'SELECT * FROM pledges WHERE campaign_id = ? AND tier_id = ? AND status = "confirmed"',
      [campaignId, limitedTierId]
    );
    expect(confirmedPledges.length).toBe(1);
  });

  test('9. Reward stock exhaustion rejects subsequent pledges', async () => {
    // Attempting another pledge now that the single slot is claimed
    const res = await request(app)
      .post(`/api/campaigns/${campaignId}/pledges`)
      .set('Authorization', `Bearer ${backer2Token}`)
      .send({
        tierId: limitedTierId,
        amount: 500,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('sold out');
  });

  test('12 & 13. Pledge cancellation restores reward stock and reduces campaign funding', async () => {
    const pool = getPool();

    // Find the confirmed pledge for the limited tier
    const [[confirmedPledge]] = await pool.query(
      'SELECT id, backer_id FROM pledges WHERE campaign_id = ? AND tier_id = ? AND status = "confirmed"',
      [campaignId, limitedTierId]
    );

    // Backer cancels their pledge (Calls cancel_pledge procedure)
    const token = confirmedPledge.backer_id === 11 ? backer1Token : backer2Token;
    const cancelRes = await request(app)
      .post(`/api/pledges/${confirmedPledge.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.pledge.pledge_status).toBe('cancelled');
    expect(cancelRes.body.data.pledge.refund_ref).toBeDefined();

    // Verify reward stock is restored atomically (claimed_quantity decremented back to 0)
    const [[restoredTier]] = await pool.query('SELECT claimed_quantity FROM reward_tiers WHERE id = ?', [limitedTierId]);
    expect(restoredTier.claimed_quantity).toBe(0);

    // Verify campaign amount reduced
    const [[camp]] = await pool.query('SELECT current_amount FROM campaigns WHERE id = ?', [campaignId]);
    expect(parseFloat(camp.current_amount)).toBe(0.00);
  });
});
