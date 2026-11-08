const { getPool } = require('../db/pool');

class AdminService {
  async getPendingCampaigns() {
    const pool = getPool();
    const [campaigns] = await pool.query(
      `SELECT c.*, cat.name as category_name, u.name as creator_name, u.email as creator_email
       FROM campaigns c
       JOIN categories cat ON c.category_id = cat.id
       JOIN users u ON c.creator_id = u.id
       WHERE c.status = 'pending_approval'
       ORDER BY c.created_at ASC`
    );
    return campaigns;
  }

  async approveCampaign(campaignId, adminId) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.query(
        'CALL approve_campaign(?, ?, @p_status, @p_message)',
        [campaignId, adminId]
      );

      const [[result]] = await conn.query(
        'SELECT @p_status as status, @p_message as message'
      );

      if (result.status !== 'SUCCESS') {
        const err = new Error(result.message || 'Approval failed.');
        err.status = result.status === 'UNAUTHORIZED' ? 403 : 400;
        throw err;
      }

      const [[campaign]] = await conn.query(
        'SELECT * FROM v_campaign_progress WHERE id = ?',
        [campaignId]
      );
      return campaign;
    } finally {
      conn.release();
    }
  }

  async rejectCampaign(campaignId, adminId, reason) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.query(
        'CALL reject_campaign(?, ?, ?, @p_status, @p_message)',
        [campaignId, adminId, reason.trim()]
      );

      const [[result]] = await conn.query(
        'SELECT @p_status as status, @p_message as message'
      );

      if (result.status !== 'SUCCESS') {
        const err = new Error(result.message || 'Rejection failed.');
        err.status = result.status === 'UNAUTHORIZED' ? 403 : 400;
        throw err;
      }

      const [[campaign]] = await conn.query(
        'SELECT * FROM campaigns WHERE id = ?',
        [campaignId]
      );
      return campaign;
    } finally {
      conn.release();
    }
  }

  async getTopCampaignsReport() {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM v_top_campaigns LIMIT 20');
    return rows;
  }

  async getCategorySuccessReport() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT
        cat.id as category_id,
        cat.name as category_name,
        COUNT(c.id) as total_campaigns,
        SUM(CASE WHEN c.status = 'successful' THEN 1 ELSE 0 END) as successful_campaigns,
        SUM(CASE WHEN c.status = 'failed' THEN 1 ELSE 0 END) as failed_campaigns,
        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
        ROUND(
          (SUM(CASE WHEN c.status = 'successful' THEN 1 ELSE 0 END) /
           NULLIF(SUM(CASE WHEN c.status IN ('successful', 'failed') THEN 1 ELSE 0 END), 0)
          ) * 100, 1
        ) as success_rate_pct,
        COALESCE(SUM(c.current_amount), 0) as total_raised
      FROM categories cat
      LEFT JOIN campaigns c ON c.category_id = cat.id
      GROUP BY cat.id, cat.name
      ORDER BY total_raised DESC
    `);
    return rows;
  }

  async getMonthlyTrendReport() {
    const pool = getPool();
    // Monthly funding trend report using a Common Table Expression (CTE)
    const [rows] = await pool.query(`
      WITH MonthlyFunding AS (
        SELECT
          DATE_FORMAT(p.created_at, '%Y-%m') as month_period,
          COUNT(p.id) as pledge_count,
          COUNT(DISTINCT p.backer_id) as unique_backers,
          SUM(p.amount) as total_pledged
        FROM pledges p
        WHERE p.status = 'confirmed'
        GROUP BY DATE_FORMAT(p.created_at, '%Y-%m')
      )
      SELECT
        month_period,
        pledge_count,
        unique_backers,
        total_pledged,
        ROUND(AVG(total_pledged) OVER (ORDER BY month_period ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) as moving_avg_funding
      FROM MonthlyFunding
      ORDER BY month_period ASC
    `);
    return rows;
  }

  async getRepeatBackersReport() {
    const pool = getPool();
    const [rows] = await pool.query(`
      SELECT
        u.id as user_id,
        u.name,
        u.email,
        COUNT(p.id) as total_pledges,
        COUNT(DISTINCT p.campaign_id) as campaigns_supported,
        SUM(p.amount) as total_spent,
        MIN(p.created_at) as first_pledge_at,
        MAX(p.created_at) as latest_pledge_at
      FROM users u
      JOIN pledges p ON u.id = p.backer_id
      WHERE p.status = 'confirmed'
      GROUP BY u.id, u.name, u.email
      HAVING campaigns_supported > 1
      ORDER BY total_spent DESC
    `);
    return rows;
  }

  async getUsers() {
    const pool = getPool();
    const [users] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        (SELECT COUNT(*) FROM campaigns c WHERE c.creator_id = u.id) as campaigns_created,
        (SELECT COUNT(*) FROM pledges p WHERE p.backer_id = u.id AND p.status = 'confirmed') as pledges_made
      FROM users u
      ORDER BY u.created_at DESC
    `);
    return users;
  }

  async updateUserStatus(userId, status) {
    const pool = getPool();
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    const [[user]] = await pool.query('SELECT id, name, email, role, status FROM users WHERE id = ?', [userId]);
    return user;
  }
}

module.exports = new AdminService();

