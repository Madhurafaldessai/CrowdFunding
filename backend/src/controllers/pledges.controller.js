const pledgesService = require('../services/pledges.service');
const { successResponse } = require('../utils/response');

class PledgesController {
  async createPledge(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const { tierId, amount, forcedPaymentOutcome } = req.body;
      const pledge = await pledgesService.createPledge(req.user.id, campaignId, {
        tierId,
        amount,
        forcedPaymentOutcome,
      });
      return successResponse(res, { pledge }, 'Pledge confirmed and processed.', 201);
    } catch (err) {
      next(err);
    }
  }

  async getMyPledges(req, res, next) {
    try {
      const pledges = await pledgesService.getMyPledges(req.user.id);
      return successResponse(res, { pledges });
    } catch (err) {
      next(err);
    }
  }

  async cancelPledge(req, res, next) {
    try {
      const { id: pledgeId } = req.params;
      const pledge = await pledgesService.cancelPledge(pledgeId, req.user.id);
      return successResponse(res, { pledge }, 'Pledge cancelled and refund issued.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PledgesController();

