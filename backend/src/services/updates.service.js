const { getPool } = require('../db/pool');

class UpdatesService {
  async getUpdates(campaignId) {
    const pool = getPool();
    const [updates] = await pool.query(
      `SELECT u.*, usr.name as creator_name, usr.avatar_url as creator_avatar
       FROM campaign_updates u
       JOIN users usr ON u.creator_id = usr.id
       WHERE u.campaign_id = ?
       ORDER BY u.created_at DESC`,
      [campaignId]
    );
    return updates;
  }

  async createUpdate(campaignId, creatorId, { title, content }) {
    const pool = getPool();
    const [campaigns] = await pool.query(
      'SELECT id, creator_id FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (campaigns.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    if (campaigns[0].creator_id !== creatorId) {
      const err = new Error('Only the campaign creator can post updates.');
      err.status = 403;
      throw err;
    }

    const [result] = await pool.query(
      'INSERT INTO campaign_updates (campaign_id, creator_id, title, content) VALUES (?, ?, ?, ?)',
      [campaignId, creatorId, title.trim(), content.trim()]
    );

    const [[created]] = await pool.query(
      `SELECT u.*, usr.name as creator_name, usr.avatar_url as creator_avatar
       FROM campaign_updates u
       JOIN users usr ON u.creator_id = usr.id
       WHERE u.id = ?`,
      [result.insertId]
    );
    return created;
  }
}

module.exports = new UpdatesService();

