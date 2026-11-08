const campaignsService = require('../services/campaigns.service');
const { successResponse } = require('../utils/response');

class CampaignsController {
  async getCampaigns(req, res, next) {
    try {
      const { page, limit, search, category, status, sort } = req.query;
      const result = await campaignsService.getCampaigns({
        page,
        limit,
        search,
        category,
        status,
        sort,
      });
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getCampaignById(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignsService.getCampaignById(id);
      return successResponse(res, { campaign });
    } catch (err) {
      next(err);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const campaign = await campaignsService.createCampaign(req.user.id, req.body);
      return successResponse(res, { campaign }, 'Campaign created successfully as draft.', 201);
    } catch (err) {
      next(err);
    }
  }

  async updateCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignsService.updateCampaign(id, req.user.id, req.body);
      return successResponse(res, { campaign }, 'Campaign updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  async submitCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignsService.submitCampaign(id, req.user.id);
      return successResponse(res, { campaign }, 'Campaign submitted for administrative review.');
    } catch (err) {
      next(err);
    }
  }

  async cancelCampaign(req, res, next) {
    try {
      const { id } = req.params;
      const campaign = await campaignsService.cancelCampaign(id, req.user.id);
      return successResponse(res, { campaign }, 'Campaign cancelled.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CampaignsController();

