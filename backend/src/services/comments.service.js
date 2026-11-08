const { getPool } = require('../db/pool');

class CommentsService {
  async getComments(campaignId) {
    const pool = getPool();
    const [comments] = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.campaign_id = ?
       ORDER BY c.created_at DESC`,
      [campaignId]
    );
    return comments;
  }

  async createComment(campaignId, userId, { comment }) {
    const pool = getPool();
    const [campaigns] = await pool.query('SELECT id FROM campaigns WHERE id = ?', [campaignId]);

    if (campaigns.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    const [result] = await pool.query(
      'INSERT INTO comments (campaign_id, user_id, comment) VALUES (?, ?, ?)',
      [campaignId, userId, comment.trim()]
    );

    const [[created]] = await pool.query(
      `SELECT c.*, u.name as author_name, u.avatar_url as author_avatar, u.role as author_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );
    return created;
  }
}

module.exports = new CommentsService();

