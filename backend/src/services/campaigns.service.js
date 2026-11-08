const { getPool } = require('../db/pool');

class CampaignsService {
  async getCampaigns({ page = 1, limit = 12, search = '', category = '', status = 'active', sort = 'trending' }) {
    const pool = getPool();
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const parsedLimit = parseInt(limit, 10);

    const conditions = [];
    const params = [];

    // Filter by status
    if (status && status !== 'all') {
      conditions.push('c.status = ?');
      params.push(status);
    }

    // Filter by category slug or id
    if (category) {
      if (isNaN(category)) {
        conditions.push('c.category_slug = ?');
        params.push(category);
      } else {
        conditions.push('c.category_id = ?');
        params.push(parseInt(category, 10));
      }
    }

    // Search query on title and description
    if (search && search.trim() !== '') {
      const trimmedSearch = search.trim();
      conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
      params.push(`%${trimmedSearch}%`, `%${trimmedSearch}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sorting strategy
    let orderByClause = 'ORDER BY c.current_amount DESC';
    switch (sort) {
      case 'newest':
        orderByClause = 'ORDER BY c.created_at DESC';
        break;
      case 'ending_soon':
        orderByClause = 'ORDER BY c.deadline ASC';
        break;
      case 'most_funded':
        orderByClause = 'ORDER BY c.current_amount DESC';
        break;
      case 'most_backed':
        orderByClause = 'ORDER BY c.backer_count DESC';
        break;
      case 'trending':
      default:
        orderByClause = 'ORDER BY c.backer_count DESC, c.current_amount DESC';
        break;
    }

    // Total count query
    const countSql = `SELECT COUNT(*) as total FROM v_campaign_progress c ${whereClause}`;
    const [[{ total }]] = await pool.query(countSql, params);

    // Data query
    const dataSql = `
      SELECT * FROM v_campaign_progress c
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    const queryParams = [...params, parsedLimit, offset];
    const [campaigns] = await pool.query(dataSql, queryParams);

    return {
      campaigns,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    };
  }

  async getCampaignById(id) {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT * FROM v_campaign_progress WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    const campaign = rows[0];

    // Fetch story from base campaigns table
    const [[baseDetails]] = await pool.query(
      'SELECT story, rejection_reason FROM campaigns WHERE id = ?',
      [id]
    );
    campaign.story = baseDetails ? baseDetails.story : '';
    campaign.rejection_reason = baseDetails ? baseDetails.rejection_reason : null;

    // Fetch reward tiers
    const [tiers] = await pool.query(
      `SELECT
         id, campaign_id, title, description, min_amount,
         quantity, claimed_quantity, estimated_delivery,
         IF(quantity IS NULL, NULL, GREATEST(0, quantity - claimed_quantity)) as remaining_quantity
       FROM reward_tiers
       WHERE campaign_id = ?
       ORDER BY min_amount ASC`,
      [id]
    );
    campaign.reward_tiers = tiers;

    // Fetch counts
    const [[{ updatesCount }]] = await pool.query(
      'SELECT COUNT(*) as updatesCount FROM campaign_updates WHERE campaign_id = ?',
      [id]
    );
    const [[{ commentsCount }]] = await pool.query(
      'SELECT COUNT(*) as commentsCount FROM comments WHERE campaign_id = ?',
      [id]
    );

    campaign.updates_count = updatesCount;
    campaign.comments_count = commentsCount;

    return campaign;
  }

  async createCampaign(creatorId, data) {
    const pool = getPool();
    const {
      categoryId,
      title,
      description,
      story,
      imageUrl,
      goalAmount,
      deadline,
    } = data;

    // Validate deadline is in the future
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      const err = new Error('Deadline must be a valid future date.');
      err.status = 400;
      throw err;
    }

    if (parseFloat(goalAmount) <= 0) {
      const err = new Error('Goal amount must be greater than zero.');
      err.status = 400;
      throw err;
    }

    const [result] = await pool.query(
      `INSERT INTO campaigns (
        creator_id, category_id, title, description, story, image_url,
        goal_amount, current_amount, backer_count, status, deadline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 0, 'draft', ?)`,
      [
        creatorId,
        categoryId,
        title.trim(),
        description.trim(),
        story.trim(),
        imageUrl || null,
        goalAmount,
        deadlineDate.toISOString().slice(0, 19).replace('T', ' '),
      ]
    );

    return this.getCampaignById(result.insertId);
  }

  async updateCampaign(campaignId, creatorId, data) {
    const pool = getPool();

    // Check ownership & current status
    const [existing] = await pool.query(
      'SELECT id, creator_id, status FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (existing.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    const camp = existing[0];
    if (camp.creator_id !== creatorId) {
      const err = new Error('Unauthorized to modify this campaign.');
      err.status = 403;
      throw err;
    }

    if (!['draft', 'pending_approval'].includes(camp.status)) {
      const err = new Error(`Cannot edit campaign in "${camp.status}" status.`);
      err.status = 400;
      throw err;
    }

    const {
      categoryId,
      title,
      description,
      story,
      imageUrl,
      goalAmount,
      deadline,
    } = data;

    const updates = [];
    const params = [];

    if (categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(categoryId);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description.trim());
    }
    if (story !== undefined) {
      updates.push('story = ?');
      params.push(story.trim());
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = ?');
      params.push(imageUrl);
    }
    if (goalAmount !== undefined) {
      if (parseFloat(goalAmount) <= 0) {
        const err = new Error('Goal amount must be positive.');
        err.status = 400;
        throw err;
      }
      updates.push('goal_amount = ?');
      params.push(goalAmount);
    }
    if (deadline !== undefined) {
      const d = new Date(deadline);
      if (d <= new Date()) {
        const err = new Error('Deadline must be in the future.');
        err.status = 400;
        throw err;
      }
      updates.push('deadline = ?');
      params.push(d.toISOString().slice(0, 19).replace('T', ' '));
    }

    if (updates.length > 0) {
      params.push(campaignId);
      await pool.query(
        `UPDATE campaigns SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return this.getCampaignById(campaignId);
  }

  async submitCampaign(campaignId, creatorId) {
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT id, creator_id, status FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (rows.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    const camp = rows[0];
    if (camp.creator_id !== creatorId) {
      const err = new Error('Unauthorized.');
      err.status = 403;
      throw err;
    }

    if (camp.status !== 'draft') {
      const err = new Error(`Only draft campaigns can be submitted for approval. Current status: ${camp.status}`);
      err.status = 400;
      throw err;
    }

    // Must have at least one reward tier
    const [[{ tierCount }]] = await pool.query(
      'SELECT COUNT(*) as tierCount FROM reward_tiers WHERE campaign_id = ?',
      [campaignId]
    );

    if (tierCount === 0) {
      const err = new Error('Please add at least one reward tier before submitting for approval.');
      err.status = 400;
      throw err;
    }

    await pool.query(
      'UPDATE campaigns SET status = "pending_approval", rejection_reason = NULL WHERE id = ?',
      [campaignId]
    );

    return this.getCampaignById(campaignId);
  }

  async cancelCampaign(campaignId, creatorId) {
    const pool = getPool();

    const [rows] = await pool.query(
      'SELECT id, creator_id, status FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (rows.length === 0) {
      const err = new Error('Campaign not found.');
      err.status = 404;
      throw err;
    }

    const camp = rows[0];
    if (camp.creator_id !== creatorId) {
      const err = new Error('Unauthorized.');
      err.status = 403;
      throw err;
    }

    if (!['draft', 'active'].includes(camp.status)) {
      const err = new Error(`Cannot cancel campaign in "${camp.status}" status.`);
      err.status = 400;
      throw err;
    }

    await pool.query(
      'UPDATE campaigns SET status = "cancelled" WHERE id = ?',
      [campaignId]
    );

    return this.getCampaignById(campaignId);
  }
}

module.exports = new CampaignsService();

