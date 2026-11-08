const creatorService = require('../services/creator.service');
const { successResponse } = require('../utils/response');

class CreatorController {
  async getCreatorCampaigns(req, res, next) {
    try {
      const campaigns = await creatorService.getCreatorCampaigns(req.user.id);
      return successResponse(res, { campaigns });
    } catch (err) {
      next(err);
    }
  }

  async getCampaignPledges(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const pledges = await creatorService.getCampaignPledges(campaignId, req.user.id);
      return successResponse(res, { pledges });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CreatorController();

