const request = require('supertest');
const { app, getAuthToken, getPool } = require('./setup');

describe('Deadline Expiry Resolution, Automated Refunds & Idempotency', () => {
  let pool;
  let successfulCampId;
  let failedCampId;
  let backerToken;

  beforeAll(async () => {
    pool = getPool();
    backerToken = await getAuthToken('backer@crowdfund.io', 'User123!');

    // 1. Setup a test campaign that MET its goal
    const [succRes] = await pool.query(
      `INSERT INTO campaigns (
        creator_id, category_id, title, description, story, goal_amount, current_amount, backer_count,
        status, start_date, deadline
      ) VALUES (
        2, 1, 'Expiring Winner Campaign', 'Testing successful deadline resolution', 'Story content...',
        1000.00, 1500.00, 2, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)
      )`
    );
    successfulCampId = succRes.insertId;

    // 2. Setup a test campaign that MISSED its goal
    const [failRes] = await pool.query(
      `INSERT INTO campaigns (
        creator_id, category_id, title, description, story, goal_amount, current_amount, backer_count,
        status, start_date, deadline
      ) VALUES (
        2, 1, 'Expiring Loser Campaign', 'Testing failed deadline resolution and refunds', 'Story content...',
        5000.00, 0.00, 0, 'active', DATE_SUB(UTC_TIMESTAMP(), INTERVAL 10 DAY), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY)
      )`
    );
    failedCampId = failRes.insertId;

    // Insert confirmed pledge on the failing campaign while deadline is in the future (accepted by trigger)
    await pool.query(
      `INSERT INTO pledges (backer_id, campaign_id, tier_id, amount, status)
       VALUES (11, ?, NULL, 500.00, 'confirmed')`,
      [failedCampId]
    );

    // Now advance deadlines to the past for both campaigns
    await pool.query(
      'UPDATE campaigns SET deadline = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 SECOND) WHERE id IN (?, ?)',
      [successfulCampId, failedCampId]
    );
  });

  test('14. process_expired_campaigns marks campaign as successful when goal is reached', async () => {
    // Run procedure
    await pool.query('CALL process_expired_campaigns()');

    const [[camp]] = await pool.query('SELECT status FROM campaigns WHERE id = ?', [successfulCampId]);
    expect(camp.status).toBe('successful');
  });

  test('15. process_expired_campaigns marks campaign as failed and refunds confirmed pledges', async () => {
    const [[camp]] = await pool.query('SELECT status FROM campaigns WHERE id = ?', [failedCampId]);
    expect(camp.status).toBe('failed');

    // Verify pledges are marked 'refunded'
    const [pledges] = await pool.query('SELECT * FROM pledges WHERE campaign_id = ?', [failedCampId]);
    expect(pledges.length).toBeGreaterThan(0);
    pledges.forEach((p) => {
      expect(p.status).toBe('refunded');
    });

    // Verify refunds table has processed records
    const [refunds] = await pool.query(
      'SELECT r.* FROM refunds r JOIN pledges p ON r.pledge_id = p.id WHERE p.campaign_id = ?',
      [failedCampId]
    );
    expect(refunds.length).toBe(pledges.length);
    expect(refunds[0].status).toBe('processed');
    expect(parseFloat(refunds[0].amount)).toBe(500.00);
  });

  test('16. Duplicate refund prevention: Running expiry again does not create duplicate refunds', async () => {
    // Count refunds before second execution
    const [initialRefunds] = await pool.query(
      'SELECT r.* FROM refunds r JOIN pledges p ON r.pledge_id = p.id WHERE p.campaign_id = ?',
      [failedCampId]
    );

    // Run procedure again
    await pool.query('CALL process_expired_campaigns()');

    // Count refunds after
    const [afterRefunds] = await pool.query(
      'SELECT r.* FROM refunds r JOIN pledges p ON r.pledge_id = p.id WHERE p.campaign_id = ?',
      [failedCampId]
    );

    expect(afterRefunds.length).toBe(initialRefunds.length);
  });
});
