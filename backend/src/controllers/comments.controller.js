const commentsService = require('../services/comments.service');
const { successResponse } = require('../utils/response');

class CommentsController {
  async getComments(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const comments = await commentsService.getComments(campaignId);
      return successResponse(res, { comments });
    } catch (err) {
      next(err);
    }
  }

  async createComment(req, res, next) {
    try {
      const { id: campaignId } = req.params;
      const comment = await commentsService.createComment(campaignId, req.user.id, req.body);
      return successResponse(res, { comment }, 'Comment posted.', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CommentsController();

