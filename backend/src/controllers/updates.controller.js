const updatesService = require('../services/updates.service');
const { successResponse } = require('../utils/response');

class UpdatesController {
  async getUpdates(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const updates = await updatesService.getUpdates(campaignId);
      return successResponse(res, { updates });
    } catch (err) {
      next(err);
    }
  }

  async createUpdate(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const update = await updatesService.createUpdate(campaignId, req.user.id, req.body);
      return successResponse(res, { update }, 'Campaign update published.', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UpdatesController();

