const tiersService = require('../services/tiers.service');
const { successResponse } = require('../utils/response');

class TiersController {
  async createTier(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const tier = await tiersService.createTier(campaignId, req.user.id, req.body);
      return successResponse(res, { tier }, 'Reward tier created.', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateTier(req, res, next) {
    try {
      const { id: campaignId, tierId } = req.params;
      const tier = await tiersService.updateTier(tierId, campaignId, req.user.id, req.body);
      return successResponse(res, { tier }, 'Reward tier updated.');
    } catch (err) {
      next(err);
    }
  }

  async deleteTier(req, res, next) {
    try {
      const { id: campaignId, tierId } = req.params;
      const result = await tiersService.deleteTier(tierId, campaignId, req.user.id);
      return successResponse(res, result, 'Reward tier deleted.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TiersController();

