const { getPool } = require('../db/pool');

class CreatorService {
  async getCreatorCampaigns(creatorId) {
    const pool = getPool();
    const [campaigns] = await pool.query(
      `SELECT * FROM v_creator_dashboard
       WHERE creator_id = ?
       ORDER BY created_at DESC`,
      [creatorId]
    );
    return campaigns;
  }

  async getCampaignPledges(campaignId, creatorId) {
    const pool = getPool();

    // Verify creator ownership
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
      const err = new Error('Unauthorized.');
      err.status = 403;
      throw err;
    }

    const [pledges] = await pool.query(
      `SELECT
         p.id as pledge_id,
         p.amount,
         p.status,
         p.created_at as pledged_at,
         u.name as backer_name,
         u.email as backer_email,
         rt.title as tier_title
       FROM pledges p
       JOIN users u ON p.backer_id = u.id
       LEFT JOIN reward_tiers rt ON p.tier_id = rt.id
       WHERE p.campaign_id = ?
       ORDER BY p.created_at DESC`,
      [campaignId]
    );

    return pledges;
  }
}

module.exports = new CreatorService();

