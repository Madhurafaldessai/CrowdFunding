const { getPool } = require('../db/pool');

class PledgesService {
  /**
   * Invokes make_pledge stored procedure with optimistic row locks,
   * atomic stock reservation, and mock payment gateway simulation.
   */
  async createPledge(backerId, campaignId, { tierId = null, amount, forcedPaymentOutcome = 'SUCCESS' }) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      const parsedAmount = parseFloat(amount);
      const parsedTierId = tierId ? parseInt(tierId, 10) : null;
      const outcome = forcedPaymentOutcome ? forcedPaymentOutcome.toUpperCase() : 'SUCCESS';

      // Call make_pledge procedure
      await conn.query(
        'CALL make_pledge(?, ?, ?, ?, ?, @p_pledge_id, @p_status, @p_message)',
        [backerId, parseInt(campaignId, 10), parsedTierId, parsedAmount, outcome]
      );

      const [[result]] = await conn.query(
        'SELECT @p_pledge_id as pledge_id, @p_status as status, @p_message as message'
      );

      if (result.status !== 'SUCCESS') {
        const err = new Error(result.message || 'Pledge processing failed.');
        err.status = result.status === 'PAYMENT_FAILED' ? 402 : 400;
        err.code = result.status;
        throw err;
      }

      // Fetch newly created pledge details
      const [pledges] = await conn.query(
        `SELECT p.*, c.title as campaign_title, pay.transaction_ref
         FROM pledges p
         JOIN campaigns c ON p.campaign_id = c.id
         LEFT JOIN payments pay ON pay.pledge_id = p.id
         WHERE p.id = ?`,
        [result.pledge_id]
      );

      return pledges[0];
    } finally {
      conn.release();
    }
  }

  async getMyPledges(backerId) {
    const pool = getPool();
    const [pledges] = await pool.query(
      `SELECT * FROM v_backer_history
       WHERE backer_id = ?
       ORDER BY pledged_at DESC`,
      [backerId]
    );
    return pledges;
  }

  /**
   * Invokes cancel_pledge stored procedure. Restores reward stock atomically,
   * updates campaign raised amount, and records refund.
   */
  async cancelPledge(pledgeId, backerId) {
    const pool = getPool();
    const conn = await pool.getConnection();

    try {
      await conn.query(
        'CALL cancel_pledge(?, ?, @p_status, @p_message)',
        [parseInt(pledgeId, 10), backerId]
      );

      const [[result]] = await conn.query(
        'SELECT @p_status as status, @p_message as message'
      );

      if (result.status !== 'SUCCESS') {
        const err = new Error(result.message || 'Pledge cancellation failed.');
        err.status = result.status === 'UNAUTHORIZED' ? 403 : 400;
        err.code = result.status;
        throw err;
      }

      const [[updatedPledge]] = await conn.query(
        'SELECT * FROM v_backer_history WHERE pledge_id = ?',
        [pledgeId]
      );

      return updatedPledge;
    } finally {
      conn.release();
    }
  }
}

module.exports = new PledgesService();

