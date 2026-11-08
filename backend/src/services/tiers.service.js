const { getPool } = require('../db/pool');

class TiersService {
  async createTier(campaignId, creatorId, data) {
    const pool = getPool();
    const [campaigns] = await pool.query(
      'SELECT id, creator_id, status FROM campaigns WHERE id = ?',
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

    if (!['draft', 'pending_approval'].includes(campaigns[0].status)) {
      const err = new Error('Cannot add reward tiers after campaign is active.');
      err.status = 400;
      throw err;
    }

    const { title, description, minAmount, quantity, estimatedDelivery } = data;

    const [result] = await pool.query(
      `INSERT INTO reward_tiers (campaign_id, title, description, min_amount, quantity, claimed_quantity, estimated_delivery)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [
        campaignId,
        title.trim(),
        description.trim(),
        parseFloat(minAmount),
        quantity ? parseInt(quantity, 10) : null,
        estimatedDelivery || null,
      ]
    );

    const [[newTier]] = await pool.query('SELECT * FROM reward_tiers WHERE id = ?', [result.insertId]);
    return newTier;
  }

  async updateTier(tierId, campaignId, creatorId, data) {
    const pool = getPool();
    const [tiers] = await pool.query(
      `SELECT rt.*, c.creator_id, c.status as campaign_status
       FROM reward_tiers rt
       JOIN campaigns c ON rt.campaign_id = c.id
       WHERE rt.id = ? AND rt.campaign_id = ?`,
      [tierId, campaignId]
    );

    if (tiers.length === 0) {
      const err = new Error('Reward tier not found.');
      err.status = 404;
      throw err;
    }

    const tier = tiers[0];
    if (tier.creator_id !== creatorId) {
      const err = new Error('Unauthorized.');
      err.status = 403;
      throw err;
    }

    const { title, description, minAmount, quantity, estimatedDelivery } = data;

    // If active and already claimed, min_amount and quantity constraints apply
    if (quantity !== undefined && quantity !== null && quantity < tier.claimed_quantity) {
      const err = new Error(`Quantity cannot be less than already claimed items (${tier.claimed_quantity}).`);
      err.status = 400;
      throw err;
    }

    await pool.query(
      `UPDATE reward_tiers
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           min_amount = COALESCE(?, min_amount),
           quantity = ?,
           estimated_delivery = COALESCE(?, estimated_delivery)
       WHERE id = ?`,
      [
        title ? title.trim() : null,
        description ? description.trim() : null,
        minAmount ? parseFloat(minAmount) : null,
        quantity ? parseInt(quantity, 10) : null,
        estimatedDelivery || null,
        tierId,
      ]
    );

    const [[updated]] = await pool.query('SELECT * FROM reward_tiers WHERE id = ?', [tierId]);
    return updated;
  }

  async deleteTier(tierId, campaignId, creatorId) {
    const pool = getPool();
    const [tiers] = await pool.query(
      `SELECT rt.*, c.creator_id, c.status as campaign_status
       FROM reward_tiers rt
       JOIN campaigns c ON rt.campaign_id = c.id
       WHERE rt.id = ? AND rt.campaign_id = ?`,
      [tierId, campaignId]
    );

    if (tiers.length === 0) {
      const err = new Error('Reward tier not found.');
      err.status = 404;
      throw err;
    }

    const tier = tiers[0];
    if (tier.creator_id !== creatorId) {
      const err = new Error('Unauthorized.');
      err.status = 403;
      throw err;
    }

    if (tier.claimed_quantity > 0) {
      const err = new Error('Cannot delete a reward tier that has existing backer pledges.');
      err.status = 400;
      throw err;
    }

    await pool.query('DELETE FROM reward_tiers WHERE id = ?', [tierId]);
    return { id: tierId };
  }
}

module.exports = new TiersService();

