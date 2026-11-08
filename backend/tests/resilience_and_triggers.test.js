const request = require('supertest');
const { app, getPool } = require('./setup');

describe('Database Resilience, Constraints & Audit Triggers', () => {
  let pool;

  beforeAll(() => {
    pool = getPool();
  });

  test('17. Health endpoint reports database latency, version, and external storage mount status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database.connected).toBe(true);
    expect(res.body.database.version).toContain('8.4');
    expect(res.body.database.latencyMs).toBeGreaterThanOrEqual(0);
    expect(res.body.storage.mounted).toBe(true);
    expect(res.body.storage.driveMount).toContain('External drive');
  });

  test('18. Database CHECK constraint rejects negative or zero goal amount', async () => {
    await expect(
      pool.query(
        `INSERT INTO campaigns (creator_id, category_id, title, description, story, goal_amount, deadline)
         VALUES (2, 1, 'Negative Goal Camp', 'Desc', 'Story', -500.00, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 DAY))`
      )
    ).rejects.toThrow();
  });

  test('18. Database CHECK constraint rejects deadline earlier than start date', async () => {
    await expect(
      pool.query(
        `INSERT INTO campaigns (creator_id, category_id, title, description, story, goal_amount, start_date, deadline)
         VALUES (2, 1, 'Invalid Dates Camp', 'Desc', 'Story', 5000.00, '2026-12-01 00:00:00', '2026-11-01 00:00:00')`
      )
    ).rejects.toThrow();
  });

  test('18. Campaign status changes trigger automatic audit_log entries', async () => {
    // Insert a test campaign
    const [ins] = await pool.query(
      `INSERT INTO campaigns (creator_id, category_id, title, description, story, goal_amount, status, deadline)
       VALUES (2, 1, 'Audit Trigger Test', 'Desc', 'Story', 1000.00, 'draft', DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 DAY))`
    );
    const testCampId = ins.insertId;

    // Update status to pending_approval
    await pool.query('UPDATE campaigns SET status = "pending_approval" WHERE id = ?', [testCampId]);

    // Check audit_log table
    const [auditRows] = await pool.query(
      'SELECT * FROM audit_log WHERE table_name = "campaigns" AND record_id = ? ORDER BY created_at DESC',
      [testCampId]
    );

    expect(auditRows.length).toBeGreaterThan(0);
    expect(auditRows[0].old_status).toBe('draft');
    expect(auditRows[0].new_status).toBe('pending_approval');
  });
});

