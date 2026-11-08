const categoriesService = require('../services/categories.service');
const { successResponse } = require('../utils/response');

class CategoriesController {
  async getCategories(req, res, next) {
    try {
      const categories = await categoriesService.getCategories();
      return successResponse(res, { categories });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoriesController();

