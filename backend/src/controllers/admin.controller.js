const adminService = require('../services/admin.service');
const { successResponse } = require('../utils/response');

class AdminController {
  async getPendingCampaigns(req, res, next) {
    try {
      const campaigns = await adminService.getPendingCampaigns();
      return successResponse(res, { campaigns });
    } catch (err) {
      next(err);
    }
  }

  async approveCampaign(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const campaign = await adminService.approveCampaign(campaignId, req.user.id);
      return successResponse(res, { campaign }, 'Campaign approved and activated.');
    } catch (err) {
      next(err);
    }
  }

  async rejectCampaign(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const { reason } = req.body;
      const campaign = await adminService.rejectCampaign(campaignId, req.user.id, reason);
      return successResponse(res, { campaign }, 'Campaign rejected and returned to draft.');
    } catch (err) {
      next(err);
    }
  }

  async getTopCampaignsReport(req, res, next) {
    try {
      const report = await adminService.getTopCampaignsReport();
      return successResponse(res, { report });
    } catch (err) {
      next(err);
    }
  }

  async getCategorySuccessReport(req, res, next) {
    try {
      const report = await adminService.getCategorySuccessReport();
      return successResponse(res, { report });
    } catch (err) {
      next(err);
    }
  }

  async getMonthlyTrendReport(req, res, next) {
    try {
      const report = await adminService.getMonthlyTrendReport();
      return successResponse(res, { report });
    } catch (err) {
      next(err);
    }
  }

  async getRepeatBackersReport(req, res, next) {
    try {
      const report = await adminService.getRepeatBackersReport();
      return successResponse(res, { report });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const users = await adminService.getUsers();
      return successResponse(res, { users });
    } catch (err) {
      next(err);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { id: userId } = req.params;
      const { status } = req.body;
      const user = await adminService.updateUserStatus(userId, status);
      return successResponse(res, { user }, 'User status updated.');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();

